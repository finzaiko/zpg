const CopydataService = require(`../services/copydata.service`);

class CopydataController {
  async runCopy(request, reply) {
    const userId = request.user.uid;
    const r = await CopydataService.runCopy(userId, request.body);
    console.log("r", r);

    reply.send(r);
  }
}

module.exports = new CopydataController();
