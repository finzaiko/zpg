const UserController = require("../../controllers/user.controller");

module.exports = async (fastify) => {
  fastify.post(`/register`, UserController.create);
};
