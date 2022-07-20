const UserController = require("../../controllers/user.controller");

module.exports = async (fastify) => {
  fastify.get(`/`, UserController.getAll);
  fastify.get(`/:id`, UserController.getById);
  // fastify.post(`/`, UserController.create);
  fastify.put(`/:id`, UserController.update);
  fastify.put(`/:id/changepass`, UserController.changePassword);
  fastify.delete(`/:id`, UserController.remove);
};
