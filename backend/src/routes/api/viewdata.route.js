const ViewdataController = require("../../controllers/viewdata.controller");

module.exports = async (fastify) => {
  fastify.get(`/data`, ViewdataController.getTableData);
  fastify.post(`/update`, ViewdataController.updateTableData);
};
