const AuthController = require("../../controllers/auth.controller");
const { verifyToken } = require("../../utils/http.utils");

module.exports = async (fastify) => {
  fastify.post(`/register`, AuthController.register);
  fastify.post(`/login`, AuthController.login);
  fastify.post("/logout", async (request, reply) => verifyToken(fastify, request, reply));
};
