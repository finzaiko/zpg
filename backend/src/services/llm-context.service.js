const { indexerPool } = require('../config/indexer-db');
const { generateEmbedding } = require('./ollama.service');

/**
 * LLM Context Builder Service
 * Implements dual retrieval with weighted merge as per PROMPT2.md
 */

// Mode weights for context retrieval
const MODE_WEIGHTS = {
  ASK: { schema: 0.7, bookmark: 0.3 },    // Schema-heavy for data questions
  FIX: { schema: 0.4, bookmark: 0.6 },    // Bookmark-heavy for fixing queries
  EXTEND: { schema: 0.3, bookmark: 0.7 }, // Bookmark-heavy for extending queries
  AUTO: { schema: 0.8, bookmark: 0.2 },   // Schema-heavy for auto-complete
};

/**
 * Detect mode from user prompt and current SQL selection
 * @param {string} userPrompt - User's input prompt
 * @param {string} currentSelection - Current SQL in editor
 * @returns {string} - Detected mode: ASK, FIX, EXTEND, or AUTO
 */
function detectMode(userPrompt, currentSelection = '') {
  const lowerPrompt = userPrompt.toLowerCase();
  const hasSql = currentSelection && currentSelection.trim().length > 0;

  // ASK: Questions about data
  if (lowerPrompt.match(/\b(kenapa|jelaskan|mengapa|apa|bagaimana|why|explain|what|how)\b/)) {
    return 'ASK';
  }

  // FIX: Has SQL with SELECT statement
  if (hasSql && currentSelection.match(/SELECT.*FROM/i)) {
    return 'FIX';
  }

  // EXTEND: Has SQL or prompt suggests modification
  if (hasSql || lowerPrompt.match(/\b(tambah|ubah|modif|ganti|change|add|modify|extend)\b/)) {
    return 'EXTEND';
  }

  // AUTO: Short prompt without SQL
  if (!hasSql && userPrompt.length < 50) {
    return 'AUTO';
  }

  // Default to ASK
  return 'ASK';
}

/**
 * Normalize text to tokens (following SUGGEST_FLOW2.md approach)
 * Converts "sales_order" or "sales order" to ["sales", "order"]
 * @param {string} text - Text to normalize
 * @returns {Array<string>} - Normalized tokens
 */
function normalizeToTokens(text) {
  return text
    .toLowerCase()
    .replace(/[_\.]/g, ' ')           // underscore and dot become space
    .replace(/[^a-z0-9 ]/g, '')       // remove special chars
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Search tables by token matching (SUGGEST_FLOW2.md Step 3)
 * Matches "sales order" with "sales_order" and "sales_order_detail"
 * @param {number} dbId - Database profile ID
 * @param {string} userPrompt - User's natural language query
 * @returns {Promise<Array>} - Matching tables based on token subset
 */
async function searchTablesByTokens(dbId, userPrompt) {
  try {
    console.log('[TOKEN_SEARCH] User prompt:', userPrompt);

    // Normalize user query to tokens
    const userTokens = normalizeToTokens(userPrompt);
    console.log('[TOKEN_SEARCH] User tokens:', userTokens);

    if (userTokens.length === 0) {
      return [];
    }

    // Extract potential table names from prompt (handle underscore and spaces)
    const cleanPrompt = userPrompt.toLowerCase().replace(/[^\w\s_]/g, ' ');
    const words = cleanPrompt.split(/\s+/).filter(w => w.length > 2);

    // Build potential table names: individual words + consecutive word pairs with underscores
    const potentialTableNames = [...words];
    for (let i = 0; i < words.length - 1; i++) {
      potentialTableNames.push(`${words[i]}_${words[i + 1]}`);
    }

    console.log('[TOKEN_SEARCH] Potential table names:', potentialTableNames);

    // Use PostgreSQL GIN index with && operator for flexible token matching
    // PRIORITY: Exact table/schema name match > token match > alias match
    const sql = `
      SELECT
        id,
        db_id,
        schema_name,
        table_name,
        content,
        name_tokens,
        alias_tokens,
        CASE
          -- Exact table name match (highest priority)
          WHEN table_name ILIKE ANY($3) THEN 2.0
          -- Exact schema name match
          WHEN schema_name ILIKE ANY($3) THEN 1.8
          -- All tokens match in name = perfect
          WHEN name_tokens @> $2 THEN 1.0
          -- All tokens match in aliases = very good
          WHEN alias_tokens @> $2 THEN 0.9
          -- Some tokens match in name = good
          WHEN name_tokens && $2 THEN 0.7
          -- Some tokens match in aliases = ok
          WHEN alias_tokens && $2 THEN 0.6
          ELSE 0.5
        END as similarity
      FROM schema_embedding
      WHERE db_id = $1
        AND (
          -- Exact name matches
          table_name ILIKE ANY($3)
          OR schema_name ILIKE ANY($3)
          -- Token matches
          OR (name_tokens IS NOT NULL AND name_tokens && $2)
          OR (alias_tokens IS NOT NULL AND alias_tokens && $2)
        )
      ORDER BY
        similarity DESC,
        schema_name, table_name
      LIMIT 50
    `;

    const result = await indexerPool.query(sql, [dbId, userTokens, potentialTableNames]);

    console.log(`[TOKEN_SEARCH] ========================================`);
    console.log(`[TOKEN_SEARCH] Params: dbId=${dbId}, userTokens=`, userTokens, 'potentialTableNames=', potentialTableNames);
    console.log(`[TOKEN_SEARCH] Found ${result.rows.length} token-based matches`);

    if (result.rows.length === 0) {
      console.log(`[TOKEN_SEARCH] WARNING: No tables found for db_id=${dbId}!`);
      console.log(`[TOKEN_SEARCH] Checking what db_ids are available...`);
      const checkResult = await indexerPool.query('SELECT DISTINCT db_id, COUNT(*) as cnt FROM schema_embedding GROUP BY db_id ORDER BY db_id');
      console.log(`[TOKEN_SEARCH] Available db_ids:`, checkResult.rows.map(r => `db_id=${r.db_id} (${r.cnt} tables)`));
    }

    result.rows.forEach(row => {
      console.log(`[TOKEN_SEARCH] ✓ Match: ${row.schema_name}.${row.table_name} (name_tokens: ${row.name_tokens?.join(', ') || 'null'}, alias_tokens: ${row.alias_tokens?.join(', ') || 'null'}, similarity: ${row.similarity})`);
    });

    return result.rows;
  } catch (error) {
    console.error('[TOKEN_SEARCH] Error:', error.message);
    return [];
  }
}

/**
 * Extract explicit table names from user prompt
 * @param {string} userPrompt - User's message
 * @returns {Array<{schema: string, table: string}>} - Extracted table references
 */
function extractTableNames(userPrompt) {
  const tables = [];

  // Match patterns like: schema.table, "schema"."table", schema.table_name (case-insensitive)
  const patterns = [
    /\b([a-zA-Z_][a-zA-Z0-9_]*)\.\s*([a-zA-Z_][a-zA-Z0-9_]*)\b/g,  // schema.table
    /"([^"]+)"\.["]?([^"'\s]+)["]?/g,                               // "schema".table or "schema"."table"
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(userPrompt)) !== null) {
      tables.push({
        schema: match[1].toLowerCase(),
        table: match[2].toLowerCase()
      });
    }
  });

  console.log('[EXTRACT] Input prompt:', userPrompt);
  console.log('[EXTRACT] Found table references:', tables);
  return tables;
}

/**
 * Search for explicit table name matches
 * @param {number} dbId - Database profile ID
 * @param {Array<{schema: string, table: string}>} tableRefs - Table references
 * @returns {Promise<Array>} - Matching schema entries
 */
async function searchExactTables(dbId, tableRefs) {
  if (!tableRefs || tableRefs.length === 0) {
    return [];
  }

  try {
    // First, let's see what tables exist for this db_id
    const checkSql = `
      SELECT schema_name, table_name
      FROM schema_embedding
      WHERE db_id = $1
      LIMIT 10
    `;
    const checkResult = await indexerPool.query(checkSql, [dbId]);
    console.log(`[EXACT_SEARCH] Available tables for db_id=${dbId}:`, checkResult.rows);

    const results = [];
    for (const ref of tableRefs) {
      console.log(`[EXACT_SEARCH] Searching for db_id=${dbId}, schema=${ref.schema}, table=${ref.table}`);
      const sql = `
        SELECT
          id,
          db_id,
          schema_name,
          table_name,
          content,
          1.0 as similarity
        FROM schema_embedding
        WHERE db_id = $1
          AND LOWER(schema_name) = LOWER($2)
          AND LOWER(table_name) = LOWER($3)
        LIMIT 5
      `;

      const result = await indexerPool.query(sql, [dbId, ref.schema, ref.table]);
      console.log(`[EXACT_SEARCH] Found ${result.rows.length} rows for ${ref.schema}.${ref.table}`);
      if (result.rows.length > 0) {
        console.log(`[EXACT_SEARCH] First result:`, result.rows[0].schema_name, result.rows[0].table_name);
      }
      results.push(...result.rows);
    }
    console.log(`[EXACT_SEARCH] Total results: ${results.length}`);
    return results;
  } catch (error) {
    console.error('Error searching exact tables:', error.message, error.stack);
    return [];
  }
}

/**
 * Search schema embeddings using hybrid approach (SUGGEST_FLOW2.md)
 * Order: 1. Exact match, 2. Token subset match, 3. Vector similarity
 * @param {number} dbId - Database profile ID
 * @param {Array<number>} queryEmbedding - Query embedding vector
 * @param {string} userPrompt - Original user prompt for keyword extraction
 * @param {number} limit - Number of results
 * @returns {Promise<Array>} - Similar schema entries
 */
async function searchSchemaEmbeddings(dbId, queryEmbedding, userPrompt = '', limit = 5) {
  if (!queryEmbedding || queryEmbedding.length === 0) {
    return [];
  }

  // Step 1: Exact match (schema.table_name format)
  const tableRefs = extractTableNames(userPrompt);
  let exactMatches = [];

  if (tableRefs.length > 0) {
    console.log('[HYBRID] Step 1: Exact match search');
    exactMatches = await searchExactTables(dbId, tableRefs);

    if (exactMatches.length > 0) {
      console.log(`[HYBRID] Found ${exactMatches.length} exact matches, returning early`);
      return exactMatches;
    }
  }

  // Step 2: Token subset matching (SUGGEST_FLOW2.md approach)
  console.log('[HYBRID] Step 2: Token-based candidate expansion');
  const tokenMatches = await searchTablesByTokens(dbId, userPrompt);

  if (tokenMatches.length > 0) {
    console.log(`[HYBRID] Found ${tokenMatches.length} token matches, returning`);
    return tokenMatches.slice(0, limit);
  }

  // Step 3: Vector similarity (fallback)
  console.log('[HYBRID] Step 3: Vector similarity search');
  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  const sql = `
    SELECT
      id,
      db_id,
      schema_name,
      table_name,
      content,
      1 - (embedding <=> $1::vector) as similarity
    FROM schema_embedding
    WHERE db_id = $2 AND embedding IS NOT NULL
    ORDER BY embedding <=> $1::vector
    LIMIT $3
  `;

  try {
    const result = await indexerPool.query(sql, [embeddingStr, dbId, limit]);
    console.log(`[HYBRID] Found ${result.rows.length} vector matches`);
    return result.rows;
  } catch (error) {
    console.error('[HYBRID] Error in vector search:', error.message);
    return [];
  }
}

/**
 * Search base query (bookmark) embeddings using vector similarity
 * @param {number} userId - User ID
 * @param {Array<number>} queryEmbedding - Query embedding vector
 * @param {number} limit - Number of results
 * @returns {Promise<Array>} - Similar bookmarks
 */
async function searchBookmarkEmbeddings(userId, queryEmbedding, limit = 5) {
  if (!queryEmbedding || queryEmbedding.length === 0) {
    return [];
  }

  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  const sql = `
    SELECT
      id,
      title,
      sql_template,
      description,
      tags,
      scope,
      1 - (embedding <=> $1::vector) as similarity
    FROM llm_base_query
    WHERE (created_by = $2 OR scope = 'global') AND embedding IS NOT NULL
    ORDER BY embedding <=> $1::vector
    LIMIT $3
  `;

  try {
    const result = await indexerPool.query(sql, [embeddingStr, userId, limit]);
    return result.rows;
  } catch (error) {
    console.error('Error searching bookmark embeddings:', error.message);
    return [];
  }
}

/**
 * Build LLM context using dual retrieval with weighted merge
 * @param {Object} params - Parameters
 * @param {number} params.dbId - Database profile ID
 * @param {number} params.userId - User ID
 * @param {string} params.userPrompt - User's prompt/question
 * @param {string} params.currentSelection - Current SQL in editor
 * @param {string} params.mode - Optional: Force specific mode (ASK, FIX, EXTEND, AUTO)
 * @returns {Promise<Object>} - Context for LLM
 */
async function buildContext({ dbId, userId, userPrompt, currentSelection = '', mode = null }) {
  try {
    // Detect mode if not provided
    const detectedMode = mode || detectMode(userPrompt, currentSelection);
    const weights = MODE_WEIGHTS[detectedMode];

    // Generate embedding for user prompt
    const queryEmbedding = await generateEmbedding(userPrompt);

    // Calculate limits based on weights
    const schemaLimit = Math.ceil(weights.schema * 5); // Max 5 total
    const bookmarkLimit = Math.ceil(weights.bookmark * 5);

    // Parallel retrieval
    const [schemaHits, bookmarkHits] = await Promise.all([
      searchSchemaEmbeddings(dbId, queryEmbedding, userPrompt, schemaLimit),
      searchBookmarkEmbeddings(userId, queryEmbedding, bookmarkLimit),
    ]);

    // Build context sections
    const context = {
      mode: detectedMode,
      weights,
      userPrompt,
      currentSelection,
      schemaContext: schemaHits.map(hit => ({
        table: `${hit.schema_name}.${hit.table_name}`,
        content: hit.content,
        similarity: hit.similarity,
      })),
      bookmarkContext: bookmarkHits.map(hit => ({
        title: hit.title,
        sqlTemplate: hit.sql_template,
        description: hit.description,
        similarity: hit.similarity,
      })),
    };

    return context;
  } catch (error) {
    console.error('Error building context:', error);
    throw error;
  }
}

/**
 * Format Stage 1 prompt for schema validation
 * @param {Object} context - Context object from buildContext
 * @returns {string} - Stage 1 validation prompt
 */
function formatStage1Prompt(context) {
  let prompt = `You are a PostgreSQL schema analyzer.
Your task is to decide whether the user request matches the provided schema context.

STRICT RULES:
- DO NOT generate SQL
- DO NOT explain anything
- DO NOT assume tables that are not present in the schema context
- If no table matches the user request, return matched: false
- Output MUST be valid JSON only

User request:
"${context.userPrompt}"
`;

  // Add current SQL if exists (for FIX/EXTEND modes)
  if (context.currentSelection && context.currentSelection.trim().length > 0) {
    prompt += `\nCurrent SQL being edited:\n${context.currentSelection}\n`;
  }

  // Add available schema context
  if (context.schemaContext.length > 0) {
    prompt += `\nAvailable schema context:\n`;
    context.schemaContext.forEach((schema, idx) => {
      prompt += `${idx + 1}. ${schema.table}\n`;
      prompt += `${schema.content}\n`;
    });
  } else {
    prompt += `\nAvailable schema context: NONE\n`;
  }

  prompt += `\nOutput format (JSON only):
{
  "matched": true or false,
  "tables": ["list", "of", "matched", "tables"],
  "reason": "brief explanation if not matched"
}

Respond with JSON only:`;

  return prompt;
}

/**
 * Format Stage 2 prompt for SQL generation
 * @param {Object} context - Context object from buildContext
 * @param {Array<string>} matchedTables - Tables validated in stage 1
 * @param {string} langCode - ISO 639-3 language code (e.g., 'eng', 'ind', 'fra')
 * @returns {string} - Stage 2 SQL generation prompt
 */
function formatStage2Prompt(context, matchedTables, langCode = 'eng') {
  // Map common language codes to language names
  const languageMap = {
    'eng': 'English',
    'ind': 'Indonesian',
    'fra': 'French',
    'spa': 'Spanish',
    'deu': 'German',
    'jpn': 'Japanese',
    'kor': 'Korean',
    'cmn': 'Chinese',
    'ara': 'Arabic',
    'rus': 'Russian',
    'por': 'Portuguese',
    'ita': 'Italian',
    'tha': 'Thai',
    'vie': 'Vietnamese'
  };

  const languageName = languageMap[langCode] || 'English';

  let prompt = `You are a PostgreSQL expert.
Generate SQL using ONLY the provided tables.
Output SQL code only, no explanation unless the mode requires it.

`;

  // Add current SQL if exists
  if (context.currentSelection && context.currentSelection.trim().length > 0) {
    prompt += `Current SQL (Editor Context):\n\`\`\`sql\n${context.currentSelection}\n\`\`\`\n\n`;
  }

  // Filter schema context to only matched tables
  const relevantSchemas = context.schemaContext.filter(schema =>
    matchedTables.some(table => schema.table.includes(table) || table.includes(schema.table))
  );

  if (relevantSchemas.length > 0) {
    prompt += `Database Schema:\n`;
    relevantSchemas.forEach((schema, idx) => {
      prompt += `\nTable ${idx + 1}: ${schema.table}\n`;
      prompt += `${schema.content}\n`;
    });
  }

  // Add bookmark context if available
  if (context.bookmarkContext.length > 0) {
    prompt += `\nSimilar Query Patterns:\n`;
    context.bookmarkContext.forEach((bookmark, idx) => {
      prompt += `\nPattern ${idx + 1}: ${bookmark.title}\n`;
      if (bookmark.description) {
        prompt += `${bookmark.description}\n`;
      }
      prompt += `\`\`\`sql\n${bookmark.sqlTemplate}\n\`\`\`\n`;
    });
  }

  // Add mode-specific instructions
  prompt += `\nTask Mode: ${context.mode}\n`;
  switch (context.mode) {
    case 'ASK':
      prompt += 'User Question: ' + context.userPrompt + '\n';
      prompt += `Provide a clear explanation using the schema information in ${languageName} language. If showing SQL examples, wrap them in \`\`\`sql code blocks.\n`;
      break;
    case 'FIX':
      prompt += 'User Request: ' + context.userPrompt + '\n';
      prompt += 'Fix or improve the current SQL query. Output the corrected SQL wrapped in ```sql code block.\n';
      break;
    case 'EXTEND':
      prompt += 'User Request: ' + context.userPrompt + '\n';
      prompt += 'Extend or modify the query. Output the modified SQL wrapped in ```sql code block.\n';
      break;
    case 'AUTO':
      prompt += 'User Request: ' + context.userPrompt + '\n';
      prompt += 'Generate SQL query based on the request. Wrap your SQL in a markdown code block like this:\n```sql\nYour SQL here\n```\n';
      break;
  }

  prompt += '\nIMPORTANT: Always wrap SQL code in ```sql markdown code blocks.\n';

  return prompt;
}

/**
 * Format context for LLM prompt (legacy single-stage, kept for compatibility)
 * @param {Object} context - Context object from buildContext
 * @returns {string} - Formatted prompt for LLM
 */
function formatContextForLLM(context) {
  let prompt = `# User Request\n${context.userPrompt}\n\n`;

  // Add current SQL if exists
  if (context.currentSelection && context.currentSelection.trim().length > 0) {
    prompt += `# Current SQL (Editor Context)\n\`\`\`sql\n${context.currentSelection}\n\`\`\`\n\n`;
  }

  // Add schema context (facts)
  if (context.schemaContext.length > 0) {
    prompt += `# Available Database Schema (Relevance: ${Math.round(context.weights.schema * 100)}%)\n`;
    context.schemaContext.forEach((schema, idx) => {
      prompt += `## Schema ${idx + 1}: ${schema.table} (${Math.round(schema.similarity * 100)}% match)\n`;
      prompt += `${schema.content}\n\n`;
    });
  }

  // Add bookmark context (patterns)
  if (context.bookmarkContext.length > 0) {
    prompt += `# Similar Query Patterns (Relevance: ${Math.round(context.weights.bookmark * 100)}%)\n`;
    context.bookmarkContext.forEach((bookmark, idx) => {
      prompt += `## Pattern ${idx + 1}: ${bookmark.title} (${Math.round(bookmark.similarity * 100)}% match)\n`;
      if (bookmark.description) {
        prompt += `Description: ${bookmark.description}\n`;
      }
      prompt += `\`\`\`sql\n${bookmark.sqlTemplate}\n\`\`\`\n\n`;
    });
  }

  // Add mode-specific instructions
  prompt += `\n# Task Mode: ${context.mode}\n`;
  switch (context.mode) {
    case 'ASK':
      prompt += 'Please answer the user\'s question using the schema information provided.\n';
      break;
    case 'FIX':
      prompt += 'Please fix or improve the current SQL query based on the patterns and schema.\n';
      break;
    case 'EXTEND':
      prompt += 'Please extend or modify the query based on the user\'s request.\n';
      break;
    case 'AUTO':
      prompt += 'Please generate a SQL query based on the user\'s description and schema.\n';
      break;
  }

  return prompt;
}

module.exports = {
  buildContext,
  formatContextForLLM,
  formatStage1Prompt,
  formatStage2Prompt,
  detectMode,
  searchSchemaEmbeddings,
  searchBookmarkEmbeddings,
  MODE_WEIGHTS,
};
