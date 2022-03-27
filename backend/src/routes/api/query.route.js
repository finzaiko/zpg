const QueryController = require("../../controllers/query.controller");

module.exports = async (fastify) => {
  fastify.post(`/run`, QueryController.runSQL);
};
