const CompareController = require("../../controllers/compare.controller");

module.exports = async (fastify) => {
  fastify.get(`/schema`, CompareController.getSchemaList);
  fastify.get(`/diff`, CompareController.getCompareSchema);
  fastify.get(`/detail`, CompareController.getContentDiff);
};
