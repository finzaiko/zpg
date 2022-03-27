const GeneratorController = require("../../controllers/generator.controller");

module.exports = async (fastify) => {
fastify.post(`/outparams`, GeneratorController.getOutParams);
};
