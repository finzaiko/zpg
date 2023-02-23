const CopydataController = require("../../controllers/copydata.controller");

module.exports = async (fastify) => {
  fastify.post(`/check_table`, CopydataController.checkTable);
  fastify.get(`/table_field`, CopydataController.getTableField);
  fastify.post(`/create_table`, CopydataController.createTable);
  fastify.post(`/runcopy`, CopydataController.runCopy);
};
