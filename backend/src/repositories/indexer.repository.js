const { db } = require("../core/database"); // For index_queue only (SQLite)
const { indexerPool } = require("../config/indexer-db"); // For schema_index and bookmark_vector (PostgreSQL)

class IndexerRepository {
  // Schema Embedding Methods (PostgreSQL)
  async getSchemaEmbedding(dbId, schemaName, tableName) {
    let sql = `SELECT * FROM schema_embedding WHERE db_id = $1`;
    const params = [dbId];
    let paramIndex = 2;

    if (schemaName) {
      sql += ` AND schema_name = $${paramIndex}`;
      params.push(schemaName);
      paramIndex++;
    }

    if (tableName) {
      sql += ` AND table_name = $${paramIndex}`;
      params.push(tableName);
    }

    sql += ` ORDER BY schema_name, table_name`;

    const result = await indexerPool.query(sql, params);
    return result.rows;
  }

  async getSchemaStats(dbId) {
    const sql = `
      SELECT
        COUNT(DISTINCT schema_name) as schema_count,
        COUNT(DISTINCT table_name) as table_count,
        COUNT(*) as total_count,
        MAX(updated_at) as last_indexed
      FROM schema_embedding
      WHERE db_id = $1
    `;

    const result = await indexerPool.query(sql, [dbId]);
    return result.rows[0] || {};
  }

  async deleteSchemaEmbedding(dbId) {
    await indexerPool.query('DELETE FROM schema_embedding WHERE db_id = $1', [dbId]);
  }

  async insertSchemaEmbedding(dbId, schemaName, tableName, content, embedding = null) {
    const sql = `
      INSERT INTO schema_embedding (
        db_id, schema_name, table_name, content, embedding, version
      ) VALUES ($1, $2, $3, $4, $5, 1)
      ON CONFLICT ON CONSTRAINT schema_embedding_pkey
      DO NOTHING
    `;

    await indexerPool.query(sql, [dbId, schemaName, tableName, content, embedding]);
  }

  async upsertSchemaEmbedding(dbId, schemaName, tableName, content, embedding = null, nameTokens = null, aliasTokens = null) {
    const sql = `
      INSERT INTO schema_embedding (
        db_id, schema_name, table_name, content, embedding, name_tokens, alias_tokens, version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 1)
      ON CONFLICT (db_id, schema_name, table_name)
      DO UPDATE SET
        content = EXCLUDED.content,
        embedding = EXCLUDED.embedding,
        name_tokens = EXCLUDED.name_tokens,
        alias_tokens = EXCLUDED.alias_tokens,
        version = schema_embedding.version + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE schema_embedding.content IS DISTINCT FROM EXCLUDED.content
    `;

    await indexerPool.query(sql, [dbId, schemaName, tableName, content, embedding, nameTokens, aliasTokens]);
  }

  // LLM Base Query Methods (PostgreSQL) - replaces bookmark_vector
  async findAllBaseQueries(userId, scope, limit, offset, search) {
    let sql = `SELECT * FROM llm_base_query WHERE created_by = $1`;
    const params = [userId];
    let paramIndex = 2;

    if (scope && scope !== 'all') {
      sql += ` OR scope = 'global'`;
    }

    if (search) {
      sql += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR sql_template ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC`;

    if (limit) {
      sql += ` LIMIT $${paramIndex}`;
      params.push(limit);
      paramIndex++;
    }

    if (offset) {
      sql += ` OFFSET $${paramIndex}`;
      params.push(offset);
    }

    const result = await indexerPool.query(sql, params);
    return result.rows;
  }

  async countBaseQueries(userId, search) {
    let sql = `SELECT COUNT(*) as total_count FROM llm_base_query WHERE created_by = $1 OR scope = 'global'`;
    const params = [userId];

    if (search) {
      sql += ` AND (title ILIKE $2 OR description ILIKE $2 OR sql_template ILIKE $2)`;
      params.push(`%${search}%`);
    }

    const result = await indexerPool.query(sql, params);
    return result.rows[0] || { total_count: 0 };
  }

  async getBaseQueryById(id, userId) {
    const sql = `SELECT * FROM llm_base_query WHERE id = $1 AND (created_by = $2 OR scope = 'global')`;
    const result = await indexerPool.query(sql, [id, userId]);
    return result.rows[0];
  }

  async createBaseQuery(userId, title, sqlTemplate, description, tags, scope = 'user') {
    const sql = `
      INSERT INTO llm_base_query (created_by, scope, title, sql_template, description, tags)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    const result = await indexerPool.query(sql, [userId, scope, title, sqlTemplate, description, tags]);
    return { id: result.rows[0].id };
  }

  async updateBaseQuery(id, userId, title, sqlTemplate, description, tags) {
    const sql = `
      UPDATE llm_base_query
      SET title = $1, sql_template = $2, description = $3, tags = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 AND created_by = $6
      RETURNING id
    `;
    const result = await indexerPool.query(sql, [title, sqlTemplate, description, tags, id, userId]);
    return { changes: result.rowCount };
  }

  async deleteBaseQuery(id, userId) {
    const sql = `DELETE FROM llm_base_query WHERE id = $1 AND created_by = $2`;
    const result = await indexerPool.query(sql, [id, userId]);
    return { changes: result.rowCount };
  }

  async searchBaseQueriesByDescription(userId, query) {
    const sql = `
      SELECT * FROM llm_base_query
      WHERE (created_by = $1 OR scope = 'global') AND (title ILIKE $2 OR description ILIKE $2)
      ORDER BY created_at DESC
      LIMIT 10
    `;
    const result = await indexerPool.query(sql, [userId, `%${query}%`]);
    return result.rows;
  }

  async updateBaseQueryEmbedding(id, embedding) {
    const sql = `
      UPDATE llm_base_query
      SET embedding = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
    await indexerPool.query(sql, [embedding, id]);
  }

  // Legacy bookmark methods (for backward compatibility)
  async findAllBookmarks(userId, limit, offset, search) {
    return this.findAllBaseQueries(userId, 'user', limit, offset, search);
  }

  async countBookmarks(userId, search) {
    return this.countBaseQueries(userId, search);
  }

  async getBookmarkById(id, userId) {
    return this.getBaseQueryById(id, userId);
  }

  async createBookmark(userId, profileId, description, baseQuery) {
    // Use description as title, baseQuery as sql_template
    return this.createBaseQuery(userId, description, baseQuery, description, null, 'user');
  }

  async updateBookmark(id, userId, description, baseQuery) {
    // Use description as title, baseQuery as sql_template
    return this.updateBaseQuery(id, userId, description, baseQuery, description, null);
  }

  async deleteBookmark(id, userId) {
    return this.deleteBaseQuery(id, userId);
  }

  async searchBookmarksByDescription(userId, query) {
    return this.searchBaseQueriesByDescription(userId, query);
  }

  async updateBookmarkEmbedding(bookmarkId, embedding) {
    return this.updateBaseQueryEmbedding(bookmarkId, embedding);
  }

  // Index Queue Methods (SQLite)
  async createIndexQueue(queueType, profileId, bookmarkId, userId) {
    const sql = `
      INSERT INTO index_queue (queue_type, profile_id, bookmark_id, user_id, status)
      VALUES (?, ?, ?, ?, 'pending')
    `;
    return new Promise((resolve, reject) => {
      db.run(sql, [queueType, profileId, bookmarkId, userId], function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  }

  async getQueueStatus(id) {
    const sql = `SELECT * FROM index_queue WHERE id = ?`;
    return new Promise((resolve, reject) => {
      db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  }

  async getQueueHistory(userId, limit = 20) {
    const sql = `
      SELECT * FROM index_queue
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    return new Promise((resolve, reject) => {
      db.all(sql, [userId, limit], (err, rows) => {
        if (err) reject(err);
        resolve(rows || []);
      });
    });
  }
}

module.exports = new IndexerRepository();
