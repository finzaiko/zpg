const CopydataController = require("../../controllers/copydata.controller");

module.exports = async (fastify) => {
  fastify.post(`/runcopy`, CopydataController.runCopy);
};
