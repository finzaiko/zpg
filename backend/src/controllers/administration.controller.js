const AdministrationService = require(`../services/administration.service`);

class AdministrationController {
  async reloadConf(request, reply) {
    const userId = request.user.uid;
    const r = await AdministrationService.reloadConf(userId, request.body);
    reply.send(r);
  }
}

module.exports = new AdministrationController();
