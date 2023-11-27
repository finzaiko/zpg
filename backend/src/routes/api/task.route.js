const TaskController = require("../../controllers/task.controller");

module.exports = async (fastify) => {
  fastify.get(`/`, TaskController.getAll);
  fastify.get(`/:id`, TaskController.getById);
  fastify.get(`/useraccessfield`, TaskController.getUserAccessByField);
  fastify.get(`/useraccesslist`, TaskController.getUserAccessListByUserId);
  fastify.post(`/`, TaskController.create);
  fastify.post(`/useraccess`, TaskController.createUserAccess);
  fastify.post(`/transfer`, TaskController.transferToTarget);
  fastify.get(`/download/:id`, TaskController.downloadBundle);
  fastify.post(`/checkbroken/:id`, TaskController.checkBrokenFile);
  fastify.put(`/:id`, TaskController.update);
  fastify.delete(`/:id`, TaskController.remove);
  fastify.delete(`/useraccess/:id`, TaskController.removeUserAccess);
};
