const AdministrationService = require(`../services/administration.service`);
const { responseOk, responseHttp } = require("../utils/http.utils");

class AdministrationController {
  async reloadConf(request, reply) {
    const userId = request.user.uid;
    const r = await AdministrationService.reloadConf(userId, request.body);
    reply.send(r);
  }

  async runAction(request, reply) {
    const userId = request.user.uid;
    const r = await AdministrationService.runAction(userId, request.body);
    // reply.send(r);
    responseHttp(reply, 200, "Ok", { data: r });
  }
}

module.exports = new AdministrationController();
