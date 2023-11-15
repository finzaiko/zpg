const TaskController = require("../../controllers/task.controller");

module.exports = async (fastify) => {
  fastify.get(`/`, TaskController.getAll);
  fastify.get(`/:id`, TaskController.getById);
  fastify.post(`/`, TaskController.create);
  fastify.post(`/transfer`, TaskController.transferToTarget);
  fastify.get(`/download/:id`, TaskController.downloadBundle);
  fastify.post(`/checkbroken/:id`, TaskController.checkBrokenFile);
  fastify.put(`/:id`, TaskController.update);
  fastify.delete(`/:id`, TaskController.remove);
};
