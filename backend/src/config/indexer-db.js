const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Indexer Database Configuration (separate PostgreSQL database)
const INDEXER_DB_CONFIG = {
  host: process.env.INDEXER_DB_HOST || 'localhost',
  port: parseInt(process.env.INDEXER_DB_PORT) || 5432,
  database: process.env.INDEXER_DB_NAME || 'zpg_indexer',
  user: process.env.INDEXER_DB_USER || 'postgres',
  password: process.env.INDEXER_DB_PASSWORD || 'postgres',
  ssl: process.env.INDEXER_DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

// Create connection pool
const indexerPool = new Pool(INDEXER_DB_CONFIG);

// Handle connection errors
indexerPool.on('error', (err) => {
  console.error('Unexpected error on indexer database client', err);
});

// Initialize tables on startup
const initIndexerTables = async () => {
  const client = await indexerPool.connect();

  try {
    console.log('🔧 Initializing indexer database tables...');

    // Try to create pgvector extension (if available)
    try {
      await client.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
      console.log('✓ pgvector extension enabled');
    } catch (err) {
      console.log('⚠ pgvector extension not available (install later for embedding support)');
    }

    // Create schema_embedding table (FACT knowledge)
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_embedding (
        id SERIAL PRIMARY KEY,
        db_id INTEGER NOT NULL,
        schema_name TEXT,
        table_name TEXT,
        column_name TEXT,
        data_type TEXT,
        content TEXT NOT NULL,
        embedding vector(1024),
        version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for schema_embedding
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_schema_embedding_db
      ON schema_embedding(db_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_schema_embedding_table
      ON schema_embedding(schema_name, table_name);
    `);

    // Try to create vector index for schema_embedding
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_schema_embedding_vector
        ON schema_embedding USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
      `);
    } catch (err) {
      // Vector index will be created when pgvector is available
    }

    // Create llm_base_query table (Intent knowledge / Bookmark)
    await client.query(`
      CREATE TABLE IF NOT EXISTS llm_base_query (
        id SERIAL PRIMARY KEY,
        scope TEXT NOT NULL DEFAULT 'user',
        title TEXT NOT NULL,
        sql_template TEXT NOT NULL,
        description TEXT,
        tags TEXT[],
        embedding vector(1024),
        created_by INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT valid_scope CHECK (scope IN ('global', 'project', 'user'))
      );
    `);

    // Create indexes for llm_base_query
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_llm_base_query_scope
      ON llm_base_query(scope);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_llm_base_query_created_by
      ON llm_base_query(created_by);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_llm_base_query_tags
      ON llm_base_query USING GIN(tags);
    `);

    // Try to create vector index for llm_base_query
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_llm_base_query_embedding
        ON llm_base_query USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
      `);
    } catch (err) {
      // Vector index will be created when pgvector is available
    }

    console.log('✓ Indexer database tables initialized successfully');
    console.log(`  - schema_embedding: stores PostgreSQL schema metadata with embeddings`);
    console.log(`  - llm_base_query: stores SQL templates/bookmarks with embeddings`);
  } catch (error) {
    console.error('❌ Error initializing indexer tables:', error.message);
    // Don't throw error, let app continue
  } finally {
    client.release();
  }
};

module.exports = {
  indexerPool,
  initIndexerTables,
  INDEXER_DB_CONFIG,
};
