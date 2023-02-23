const CopydataService = require(`../services/copydata.service`);

class CopydataController {
  async checkTable(request, reply) {
    const userId = request.user.uid;
    const tbl = await CopydataService.checkTable(userId, request.body);
    let sourceFiels = [];
    if(request.body.type_copy=="query"){
      sourceFiels = await CopydataService.getTableField(userId, request.body);
    }
    reply.send({ exists: tbl.exists, source_fields: sourceFiels });
  }

  async getTableField(request, reply) {
    const userId = request.user.uid;
    const r = await CopydataService.getTableField(userId, request.query);
    reply.send(r);
  }

  async createTable(request, reply) {
    const userId = request.user.uid;
    const isCreated = await CopydataService.createTable(userId, request.body);
    reply.send({ error: !isCreated });
  }

  async runCopy(request, reply) {
    const userId = request.user.uid;
    const r = await CopydataService.runCopy(userId, request.body);
    reply.send(r);
  }
}

module.exports = new CopydataController();
