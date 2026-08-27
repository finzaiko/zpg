const { Worker } = require('bullmq');
const { redisConnection } = require('../config/queue');
const { Pool } = require('pg');
const IndexerRepository = require('../repositories/indexer.repository');
const { db } = require('../core/database'); // Only for index_queue table
const { generateEmbedding, checkOllamaAvailability } = require('../services/ollama.service');

// Token normalization function (same as in llm-context.service.js)
function normalizeToTokens(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[_.\s]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(token => token.length > 0);
}

// Extract alias tokens from table comments and column comments
function extractAliasTokens(tableData) {
  const tokens = [];

  // Extract from table comment
  if (tableData.table_comment) {
    const tableCommentTokens = normalizeToTokens(tableData.table_comment);
    tokens.push(...tableCommentTokens);
  }

  // Extract from column names and comments
  if (tableData.columns && Array.isArray(tableData.columns)) {
    for (const col of tableData.columns) {
      // Add column name tokens
      if (col.column_name) {
        const colNameTokens = normalizeToTokens(col.column_name);
        tokens.push(...colNameTokens);
      }

      // Add column comment tokens
      if (col.column_comment) {
        const colCommentTokens = normalizeToTokens(col.column_comment);
        tokens.push(...colCommentTokens);
      }
    }
  }

  // Remove duplicates and return
  return [...new Set(tokens)];
}

// Helper function to get excluded schemas from SQLite
function getExcludedSchemas(profileId) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT schema_name FROM excluded_schema WHERE profile_id = ?';
    db.all(sql, [profileId], (err, rows) => {
      if (err) {
        console.error('Error fetching excluded schemas:', err);
        resolve([]); // Return empty array on error, don't fail the indexing
      } else {
        const schemas = rows.map(row => row.schema_name);
        resolve(schemas);
      }
    });
  });
}

// Schema Index Worker
const schemaIndexWorker = new Worker(
  'schema-index',
  async (job) => {
    const { profileId, userId, connectionConfig } = job.data;

    console.log(`Starting schema indexing for profile ${profileId}`);

    try {
      // Update queue status to processing
      await updateQueueStatus(job.id, 'processing', null);

      // Get excluded schemas for this profile from SQLite
      const excludedSchemas = await getExcludedSchemas(profileId);
      console.log(`Excluded schemas for profile ${profileId}:`, excludedSchemas);

      // Create PostgreSQL connection
      const pool = new Pool(connectionConfig);

      // Delete old schema embeddings for this profile (use profileId as db_id)
      await IndexerRepository.deleteSchemaEmbedding(profileId);

      // Build excluded schemas condition for SQL query
      let excludedSchemasCondition = '';
      if (excludedSchemas.length > 0) {
        const excludedList = excludedSchemas.map(s => `'${s.replace(/'/g, "''")}'`).join(', ');
        excludedSchemasCondition = ` AND n.nspname NOT IN (${excludedList})`;
      }

      // Query to get tables grouped by schema with all columns
      const schemaQuery = `
        SELECT
          n.nspname as schema_name,
          c.relname as table_name,
          obj_description(c.oid, 'pg_class') as table_comment,
          json_agg(
            json_build_object(
              'column_name', a.attname,
              'data_type', t.typname,
              'is_nullable', CASE WHEN a.attnotnull THEN 'NO' ELSE 'YES' END,
              'column_default', pg_get_expr(ad.adbin, ad.adrelid),
              'constraint_type', con.contype,
              'foreign_table', cf.relname,
              'column_comment', col_description(c.oid, a.attnum)
            ) ORDER BY a.attnum
          ) as columns
        FROM pg_catalog.pg_attribute a
        JOIN pg_catalog.pg_class c ON a.attrelid = c.oid
        JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
        JOIN pg_catalog.pg_type t ON a.atttypid = t.oid
        LEFT JOIN pg_catalog.pg_attrdef ad ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
        LEFT JOIN pg_catalog.pg_constraint con ON con.conrelid = c.oid AND a.attnum = ANY(con.conkey)
        LEFT JOIN pg_catalog.pg_class cf ON con.confrelid = cf.oid
        WHERE a.attnum > 0
          AND NOT a.attisdropped
          AND c.relkind IN ('r', 'v', 'm', 'f', 'p')
          AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')${excludedSchemasCondition}
        GROUP BY n.nspname, c.relname, c.oid
        ORDER BY n.nspname, c.relname;
      `;

      const result = await pool.query(schemaQuery);

      // Check if Ollama is available for embedding generation
      const ollamaAvailable = await checkOllamaAvailability();
      if (ollamaAvailable) {
        console.log('✓ Ollama is available, embeddings will be generated');
      } else {
        console.log('⚠ Ollama not available, skipping embeddings');
      }

      // Process each table and create content string
      let totalTables = 0;
      for (const row of result.rows) {
        const content = generateTableContent(row);

        // Generate embedding using Ollama if available
        let embedding = null;
        if (ollamaAvailable) {
          try {
            const embeddingArray = await generateEmbedding(content);
            // Format as PostgreSQL vector string: [0.1,0.2,0.3,...]
            embedding = `[${embeddingArray.join(',')}]`;
            console.log(`Generated embedding for ${row.schema_name}.${row.table_name}`);
          } catch (error) {
            console.error(`Failed to generate embedding for ${row.schema_name}.${row.table_name}:`, error.message);
          }
        }

        // Generate name tokens for fuzzy matching
        const nameTokens = normalizeToTokens(row.table_name);
        console.log(`[TOKEN] Generated name tokens for ${row.table_name}:`, nameTokens);

        // Generate alias tokens from table comment and column comments
        const aliasTokens = extractAliasTokens(row);
        console.log(`[TOKEN] Generated alias tokens for ${row.table_name}:`, aliasTokens);

        // Insert into schema_embedding with generated embedding and tokens
        await IndexerRepository.upsertSchemaEmbedding(
          profileId,  // use profileId as db_id
          row.schema_name,
          row.table_name,
          content,
          embedding,
          nameTokens,   // name_tokens for token matching
          aliasTokens   // alias_tokens extracted from comments
        );
        totalTables++;
      }

      await pool.end();

      // Update queue status to completed
      await updateQueueStatus(job.id, 'completed', null);

      console.log(`Schema indexing completed for profile ${profileId}: ${totalTables} tables indexed`);

      return { success: true, tablesIndexed: totalTables };
    } catch (error) {
      console.error(`Error indexing schema for profile ${profileId}:`, error);
      await updateQueueStatus(job.id, 'failed', error.message);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 2, // Process 2 jobs simultaneously
  }
);

// Bookmark Index Worker (generates embeddings for base queries)
const bookmarkIndexWorker = new Worker(
  'bookmark-index',
  async (job) => {
    const { bookmarkId, userId, description, baseQuery } = job.data;

    console.log(`Starting bookmark indexing for bookmark ${bookmarkId}`);

    try {
      await updateQueueStatus(job.id, 'processing', null);

      // Check if Ollama is available
      const ollamaAvailable = await checkOllamaAvailability();

      let embedding = null;
      if (ollamaAvailable) {
        try {
          // Combine description and query for better embedding context
          const textToEmbed = `${description}\n\nSQL Query:\n${baseQuery}`;
          const embeddingArray = await generateEmbedding(textToEmbed);
          // Format as PostgreSQL vector string: [0.1,0.2,...]
          embedding = `[${embeddingArray.join(',')}]`;
          console.log(`✓ Generated embedding for bookmark ${bookmarkId} (${embeddingArray.length} dimensions)`);
        } catch (error) {
          console.error(`✗ Failed to generate embedding for bookmark ${bookmarkId}:`, error.message);
        }
      } else {
        console.log('⚠ Ollama not available, skipping embedding for bookmark');
      }

      // Update bookmark with embedding in PostgreSQL
      await IndexerRepository.updateBookmarkEmbedding(bookmarkId, embedding);

      await updateQueueStatus(job.id, 'completed', null);

      console.log(`Bookmark indexing completed for bookmark ${bookmarkId}`);

      return { success: true, bookmarkId };
    } catch (error) {
      console.error(`Error indexing bookmark ${bookmarkId}:`, error);
      await updateQueueStatus(job.id, 'failed', error.message);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 2,
  }
);

// Helper functions for SQLite operations (index_queue only)
function generateTableContent(tableData) {
  const { schema_name, table_name, table_comment, columns } = tableData;

  let content = `Table ${schema_name}.${table_name}\n`;

  if (table_comment) {
    content += `Description: ${table_comment}\n`;
  }

  content += `\nColumns:\n`;

  for (const col of columns) {
    let line = `- ${col.column_name} ${col.data_type}`;

    // Add constraints
    if (col.constraint_type === 'p') line += ' PK';
    if (col.constraint_type === 'f') line += ` FK -> ${col.foreign_table}`;
    if (col.is_nullable === 'NO') line += ' NOT NULL';
    if (col.column_default) line += ` DEFAULT ${col.column_default}`;

    // Add comment if exists
    if (col.column_comment) {
      line += ` -- ${col.column_comment}`;
    }

    content += line + '\n';
  }

  return content;
}

function updateQueueStatus(jobId, status, errorMessage) {
  return new Promise((resolve, reject) => {
    let sql, params;

    if (status === 'processing') {
      sql = 'UPDATE index_queue SET status = ?, started_at = datetime("now","localtime") WHERE id = ?';
      params = [status, jobId];
    } else if (status === 'completed') {
      sql = 'UPDATE index_queue SET status = ?, completed_at = datetime("now","localtime") WHERE id = ?';
      params = [status, jobId];
    } else if (status === 'failed') {
      sql = 'UPDATE index_queue SET status = ?, error_message = ?, completed_at = datetime("now","localtime") WHERE id = ?';
      params = [status, errorMessage, jobId];
    } else {
      return resolve();
    }

    db.run(sql, params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Event listeners
schemaIndexWorker.on('completed', (job) => {
  console.log(`Schema index job ${job.id} completed`);
});

schemaIndexWorker.on('failed', (job, err) => {
  console.error(`Schema index job ${job.id} failed:`, err.message);
});

bookmarkIndexWorker.on('completed', (job) => {
  console.log(`Bookmark index job ${job.id} completed`);
});

bookmarkIndexWorker.on('failed', (job, err) => {
  console.error(`Bookmark index job ${job.id} failed:`, err.message);
});

module.exports = {
  schemaIndexWorker,
  bookmarkIndexWorker,
};
