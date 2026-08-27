const axios = require('axios');

// Ollama Configuration
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const EMBEDDING_MODEL = process.env.OLLAMA_EMBED_MODEL || 'bge-m3';
const CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || 'llama2';

/**
 * Generate embedding using Ollama with bge-m3 model
 * @param {string} text - Text to generate embedding for
 * @returns {Promise<Array<number>>} - Embedding vector
 */
async function generateEmbedding(text) {
  try {
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/embeddings`, {
      model: EMBEDDING_MODEL,
      prompt: text,
    }, {
      timeout: 30000, // 30 seconds timeout
    });

    if (response.data && response.data.embedding) {
      return response.data.embedding;
    }

    throw new Error('No embedding returned from Ollama');
  } catch (error) {
    console.error('Error generating embedding:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error(`Could not connect to Ollama at ${OLLAMA_BASE_URL}`);
      console.error('Make sure Ollama is running: ollama serve');
    }
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * @param {Array<string>} texts - Array of texts to generate embeddings for
 * @returns {Promise<Array<Array<number>>>} - Array of embedding vectors
 */
async function generateEmbeddings(texts) {
  const embeddings = [];

  for (const text of texts) {
    try {
      const embedding = await generateEmbedding(text);
      embeddings.push(embedding);
    } catch (error) {
      console.error(`Failed to generate embedding for text: ${text.substring(0, 50)}...`);
      embeddings.push(null);
    }
  }

  return embeddings;
}

/**
 * Check if Ollama is available and the model is loaded
 * @returns {Promise<boolean>}
 */
async function checkOllamaAvailability() {
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, {
      timeout: 5000,
    });

    if (response.data && response.data.models) {
      const modelExists = response.data.models.some(m => m.name.includes(EMBEDDING_MODEL));

      if (!modelExists) {
        console.warn(`Model ${EMBEDDING_MODEL} not found in Ollama.`);
        console.warn(`Pull the model with: ollama pull ${EMBEDDING_MODEL}`);
        return false;
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error('Ollama is not available:', error.message);
    return false;
  }
}

/**
 * Format embedding for PostgreSQL vector type
 * @param {Array<number>} embedding - Embedding vector
 * @returns {string} - Formatted vector string for PostgreSQL
 */
function formatEmbeddingForPostgres(embedding) {
  if (!embedding || !Array.isArray(embedding)) {
    return null;
  }

  // PostgreSQL vector format: [0.1, 0.2, 0.3, ...]
  return `[${embedding.join(',')}]`;
}

module.exports = {
  generateEmbedding,
  generateEmbeddings,
  checkOllamaAvailability,
  formatEmbeddingForPostgres,
  OLLAMA_BASE_URL,
  EMBEDDING_MODEL,
  CHAT_MODEL,
};
