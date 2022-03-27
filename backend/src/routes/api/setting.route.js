const SettingController = require("../../controllers/setting.controller");

module.exports = async (fastify) => {
  fastify.get(`/`, SettingController.getAll);
};
