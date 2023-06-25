const AdministrationController = require("../../controllers/administration.controller");

module.exports = async (fastify) => {
  fastify.post(`/reloadconf`, AdministrationController.reloadConf);
};
