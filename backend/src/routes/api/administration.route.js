const AdministrationController = require("../../controllers/administration.controller");

module.exports = async (fastify) => {
  fastify.post(`/reloadconf`, AdministrationController.reloadConf);
  fastify.post(`/runaction`, AdministrationController.runAction);
  fastify.post(`/view`, AdministrationController.view);
};
