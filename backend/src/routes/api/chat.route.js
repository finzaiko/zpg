const ChatController = require("../../controllers/chat.controller");

module.exports = function (fastify, opts, done) {
  // Build context only (for testing/debugging)
  fastify.post(`/context/build`, ChatController.buildContext);

  // Chat with LLM using context
  fastify.post(`/chat`, ChatController.chat);

  // Test endpoints
  fastify.get(`/test/schema-search`, ChatController.testSchemaSearch);
  fastify.get(`/test/bookmark-search`, ChatController.testBookmarkSearch);

  done();
};
