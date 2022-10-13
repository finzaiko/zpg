const QueryController = require("../../controllers/query.controller");

module.exports = async (fastify) => {
  fastify.post(`/run`, QueryController.runSQL);
  fastify.get(`/table_name`, QueryController.getTableName);
};
