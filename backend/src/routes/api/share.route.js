const ShareController = require("../../controllers/share.controller");

module.exports = async (fastify) => {
  fastify.get(`/`, ShareController.getAll);
  fastify.post(`/`, ShareController.create);
  fastify.delete(`/:status/:id`, ShareController.remove);
};
