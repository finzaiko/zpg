const { verifyToken } = require("../../utils/http.utils");
const SettingController = require("../../controllers/setting.controller");
const ProfileController = require("../../controllers/profile.controller");

module.exports = async (fastify) => {
  fastify.post("/ping", async (request, reply) =>
    verifyToken(fastify, request, reply)
  );

  fastify.get(`/meta`, SettingController.getByMultiKey);
  fastify.get(`/app`, ProfileController.getUserProfile);
};
