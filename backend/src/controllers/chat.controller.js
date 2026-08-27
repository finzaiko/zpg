const { responseHttp } = require("../utils/http.utils");
const LLMContextService = require("../services/llm-context.service");
const axios = require('axios');

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || 'llama2';

// Lazy load franc (ES module)
let francModule = null;
async function getFranc() {
  if (!francModule) {
    francModule = await import('franc');
  }
  return francModule.franc;
}

class ChatController {
  /**
   * Build context for LLM without sending to LLM
   * Useful for debugging and testing context retrieval
   */
  async buildContext(request, reply) {
    try {
      const userId = request.user.uid;
      const { profileId, userPrompt, currentSelection, mode } = request.body;

      if (!profileId || !userPrompt) {
        return responseHttp(reply, 400, "Bad Request", {
          error: "profileId and userPrompt are required",
        });
      }

      const context = await LLMContextService.buildContext({
        dbId: profileId,
        userId,
        userPrompt,
        currentSelection: currentSelection || '',
        mode,
      });

      responseHttp(reply, 200, "Ok", { context });
    } catch (error) {
      console.error("Error building context:", error);
      responseHttp(reply, 500, "Internal Server Error", {
        error: error.message,
      });
    }
  }

  /**
   * Chat with LLM using retrieved context (Two-Stage Approach)
   */
  async chat(request, reply) {
    try {
      const userId = request.user.uid;
      const { profileId, userPrompt, currentSelection, mode, stream = false } = request.body;

      console.log('[CHAT] ========================================');
      console.log('[CHAT] Request received:', { userId, profileId, userPrompt: userPrompt.substring(0, 100), mode });
      console.log('[CHAT] IMPORTANT: Using db_id/profileId =', profileId);

      if (!profileId || !userPrompt) {
        return responseHttp(reply, 400, "Bad Request", {
          error: "profileId and userPrompt are required",
        });
      }

      // Build context using dual retrieval
      console.log('[CHAT] Building context...');
      const context = await LLMContextService.buildContext({
        dbId: profileId,
        userId,
        userPrompt,
        currentSelection: currentSelection || '',
        mode,
      });
      console.log('[CHAT] Context built:', {
        mode: context.mode,
        schemaCount: context.schemaContext.length,
        bookmarkCount: context.bookmarkContext.length
      });

      // STAGE 1: Schema Validation
      console.log('[CHAT] Stage 1: Schema validation...');
      const stage1Prompt = LLMContextService.formatStage1Prompt(context);

      const stage1Response = await axios.post(
        `${OLLAMA_BASE_URL}/api/generate`,
        {
          model: CHAT_MODEL,
          prompt: stage1Prompt,
          stream: false,
          format: 'json', // Request JSON response
        },
        {
          timeout: 30000, // 30 seconds
        }
      );

      console.log('[CHAT] Stage 1 raw response:', stage1Response.data.response);

      // Parse stage 1 response
      let validation;
      try {
        validation = JSON.parse(stage1Response.data.response);
      } catch (parseError) {
        console.error('[CHAT] Failed to parse Stage 1 JSON:', parseError);
        // Fallback: assume matched if we have schema context
        validation = {
          matched: context.schemaContext.length > 0,
          tables: context.schemaContext.map(s => s.table),
          reason: 'JSON parse failed, using fallback'
        };
      }

      console.log('[CHAT] Stage 1 validation:', validation);

      // If no match, return helpful error
      if (!validation.matched || !validation.tables || validation.tables.length === 0) {
        const errorResponse = {
          mode: context.mode,
          weights: context.weights,
          schemaCount: context.schemaContext.length,
          bookmarkCount: context.bookmarkContext.length,
          response: `⚠️ No matching tables found in the database schema.\n\n${validation.reason || 'The requested tables do not exist in the current database.'}\n\nAvailable schemas:\n${context.schemaContext.slice(0, 3).map(s => `- ${s.table}`).join('\n') || '(No similar tables found)'}`,
          model: CHAT_MODEL,
          matched: false,
          validationReason: validation.reason,
        };

        return responseHttp(reply, 200, "Ok", errorResponse);
      }

      // STAGE 2: SQL Generation (only if validated)
      console.log('[CHAT] Stage 2: SQL generation with matched tables:', validation.tables);

      // Detect language for ASK/EXPLAIN modes
      let detectedLanguage = 'eng'; // default English
      if (context.mode === 'ASK' || context.mode === 'EXPLAIN') {
        try {
          const franc = await getFranc();
          const langCode = franc(userPrompt, { minLength: 10 });
          if (langCode !== 'und') { // 'und' means undetermined
            detectedLanguage = langCode;
            console.log('[CHAT] Detected language:', langCode);
          }
        } catch (err) {
          console.error('[CHAT] Language detection failed:', err.message);
        }
      }

      const stage2Prompt = LLMContextService.formatStage2Prompt(context, validation.tables, detectedLanguage);

      const stage2Response = await axios.post(
        `${OLLAMA_BASE_URL}/api/generate`,
        {
          model: CHAT_MODEL,
          prompt: stage2Prompt,
          stream: false,
        },
        {
          timeout: 60000, // 60 seconds
        }
      );

      console.log('[CHAT] Stage 2 response received:', {
        hasResponse: !!stage2Response.data.response,
        responseLength: stage2Response.data.response ? stage2Response.data.response.length : 0
      });

      // Post-process response: for AUTO mode, ensure SQL is wrapped in markdown code blocks
      let processedResponse = stage2Response.data.response;

      if (context.mode === 'AUTO' && !processedResponse.includes('```sql')) {
        // For AUTO mode, if response doesn't have markdown and looks like SQL, wrap it
        const sqlKeywords = /^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH|TRUNCATE|MERGE)\s+/i;
        if (sqlKeywords.test(processedResponse.trim())) {
          processedResponse = '```sql\n' + processedResponse.trim() + '\n```';
          console.log('[CHAT] Wrapped AUTO mode SQL response in markdown code block');
        }
      }
      // For ASK/EXPLAIN/FIX/EXTEND modes, leave response as-is (may contain explanation + SQL)

      const responseData = {
        mode: context.mode,
        weights: context.weights,
        schemaCount: context.schemaContext.length,
        bookmarkCount: context.bookmarkContext.length,
        response: processedResponse,
        model: CHAT_MODEL,
        matched: true,
        matchedTables: validation.tables,
        context: {
          schemaContext: context.schemaContext,
          bookmarkContext: context.bookmarkContext,
        },
      };

      console.log('[CHAT] Sending response to client:', {
        mode: responseData.mode,
        schemaCount: responseData.schemaCount,
        hasResponse: !!responseData.response
      });

      responseHttp(reply, 200, "Ok", responseData);
    } catch (error) {
      console.error("Error in chat:", error.message, error.stack);

      if (error.code === 'ECONNREFUSED') {
        return responseHttp(reply, 503, "Service Unavailable", {
          error: `Cannot connect to Ollama at ${OLLAMA_BASE_URL}`,
        });
      }

      responseHttp(reply, 500, "Internal Server Error", {
        error: error.message,
      });
    }
  }

  /**
   * Test schema search
   */
  async testSchemaSearch(request, reply) {
    try {
      const userId = request.user.uid;
      const { profileId, query, limit = 5 } = request.query;

      if (!profileId || !query) {
        return responseHttp(reply, 400, "Bad Request", {
          error: "profileId and query are required",
        });
      }

      const { generateEmbedding } = require('../services/ollama.service');
      const queryEmbedding = await generateEmbedding(query);

      const results = await LLMContextService.searchSchemaEmbeddings(
        parseInt(profileId),
        queryEmbedding,
        parseInt(limit)
      );

      responseHttp(reply, 200, "Ok", {
        query,
        results,
        count: results.length,
      });
    } catch (error) {
      console.error("Error in schema search:", error);
      responseHttp(reply, 500, "Internal Server Error", {
        error: error.message,
      });
    }
  }

  /**
   * Test bookmark search
   */
  async testBookmarkSearch(request, reply) {
    try {
      const userId = request.user.uid;
      const { query, limit = 5 } = request.query;

      if (!query) {
        return responseHttp(reply, 400, "Bad Request", {
          error: "query is required",
        });
      }

      const { generateEmbedding } = require('../services/ollama.service');
      const queryEmbedding = await generateEmbedding(query);

      const results = await LLMContextService.searchBookmarkEmbeddings(
        userId,
        queryEmbedding,
        parseInt(limit)
      );

      responseHttp(reply, 200, "Ok", {
        query,
        results,
        count: results.length,
      });
    } catch (error) {
      console.error("Error in bookmark search:", error);
      responseHttp(reply, 500, "Internal Server Error", {
        error: error.message,
      });
    }
  }
}

module.exports = new ChatController();
