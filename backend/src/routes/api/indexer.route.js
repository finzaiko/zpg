const IndexerController = require("../../controllers/indexer.controller");

module.exports = async (fastify) => {
  // Schema Index Routes
  fastify.post(`/schema-index/trigger`, IndexerController.triggerSchemaIndex);
  fastify.get(`/schema-index`, IndexerController.getSchemaIndex);
  fastify.get(`/schema-index/stats`, IndexerController.getSchemaStats);
  fastify.delete(`/schema-index/:profileId`, IndexerController.deleteSchemaIndex);

  // Bookmark Routes
  fastify.get(`/bookmarks`, IndexerController.findAllBookmarks);
  fastify.get(`/bookmarks/search`, IndexerController.searchBookmarks);
  fastify.get(`/bookmarks/:id`, IndexerController.getBookmarkById);
  fastify.post(`/bookmarks`, IndexerController.createBookmark);
  fastify.put(`/bookmarks/:id`, IndexerController.updateBookmark);
  fastify.delete(`/bookmarks/:id`, IndexerController.deleteBookmark);

  // Queue Management Routes
  fastify.get(`/queue/:queueId`, IndexerController.getQueueStatus);
  fastify.get(`/queue-history`, IndexerController.getQueueHistory);
};
