const GeneratorService = require(`../services/generator.service`);
const { responseOk, responseValidate } = require("../utils/http.utils");

class GeneratorController {
  async getOutParams(request, reply) {
    const { id, querysql } = request.body; 
    const userId = request.user.uid;
    const data = await GeneratorService.getOutParams(id, userId, querysql);
    responseOk(reply, { data: data });
  }
}

module.exports = new GeneratorController();
