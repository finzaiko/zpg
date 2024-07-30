const ProfileController = require("../../controllers/profile.controller");

module.exports = async (fastify) => {
  fastify.get(`/conn`, ProfileController.findAll);
  fastify.post(`/conn`, ProfileController.createConn);
  fastify.post(`/que`, ProfileController.updateQue);
  fastify.put(`/conn/:id`, ProfileController.updateConn);
  fastify.delete(`/conn/:id`, ProfileController.removeConn);
  fastify.post(`/conn/test`, ProfileController.testConn);
  fastify.get(`/conncheck`, ProfileController.check);

  fastify.get(`/content`, ProfileController.findAll);
  fastify.get(`/content/:id`, ProfileController.getById);
  fastify.post(`/content`, ProfileController.createContent);
  fastify.put(`/content/:id`, ProfileController.updateContent);
  fastify.delete(`/content/:id`, ProfileController.removeContent);

  fastify.post(`/copyconn`, ProfileController.copyConnContent);
  fastify.get(`/export`, ProfileController.getExport);
  fastify.post(`/import`, ProfileController.setImport);
};
