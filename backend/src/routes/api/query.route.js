const QueryController = require("../../controllers/query.controller");

module.exports = async (fastify) => {
  fastify.post(`/run`, QueryController.runSQL);
  fastify.post(`/run_cancel`, QueryController.runCancelSQL);
  fastify.get(`/table_name`, QueryController.getTableName);
  fastify.get(`/is_table`, QueryController.getIsTable);
};
