const ShareController = require("../../controllers/share.controller");

module.exports = async (fastify) => {
  fastify.get(`/`, ShareController.getAll);
  fastify.post(`/`, ShareController.create);
};
