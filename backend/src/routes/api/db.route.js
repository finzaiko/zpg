const DbController = require("../../controllers/db.controller");

module.exports = async (fastify) => {
  fastify.get(`/`, DbController.getAll);
  fastify.get(`/schema`, DbController.getSchemaTree);
  fastify.get(`/schema_content`, DbController.getSchemaContentTree);
  fastify.get(`/content_search`, DbController.getContentSearch);
  fastify.get(`/schema_list`, DbController.getSchemaContent);
};
