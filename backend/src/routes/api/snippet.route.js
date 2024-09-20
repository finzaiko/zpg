const SnippetController = require("../../controllers/snippet.controller");

module.exports = async (fastify) => {
  fastify.get(`/`, SnippetController.getAll);
  fastify.get(`/search`, SnippetController.getSearch);
  // fastify.get(`/:id`, SnippetController.getById);
  // fastify.post(`/`, SnippetController.create);
  // fastify.post(`/useraccess`, SnippetController.createUserAccess);
  // fastify.put(`/:id`, SnippetController.update);
  // fastify.delete(`/:id`, SnippetController.remove);
};
