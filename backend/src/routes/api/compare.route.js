const CompareController = require("../../controllers/compare.controller");

module.exports = async (fastify) => {
  fastify.get(`/schema`, CompareController.getSchemaList);
  fastify.get(`/diff`, CompareController.getCompareSchema);
  fastify.get(`/detail`, CompareController.getContentDiff);
  fastify.get(`/generate`, CompareController.generateDiff);
  fastify.get(`/generate_rowcount`, CompareController.generateTableRowDiff);
  fastify.get(`/result`, CompareController.getResultDiff);
};
