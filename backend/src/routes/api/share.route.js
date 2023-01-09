const ShareController = require("../../controllers/share.controller");

module.exports = async (fastify) => {
  fastify.get(`/`, ShareController.getAll);
  fastify.get(`/by`, ShareController.getByField);
  fastify.get(`/viewverify`, ShareController.checkViewRole);
  fastify.post(`/`, ShareController.create);
  fastify.put(`/:id`, ShareController.update);
  fastify.put(`/read/:id`, ShareController.updateRead);
  fastify.delete(`/:status/:id`, ShareController.remove);
};
