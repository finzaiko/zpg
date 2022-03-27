const SettingService = require(`../services/setting.service`);
const { responseHttp } = require("../utils/http.utils");

class SettingController {
  async getAll(request, reply) {
    const userId = request.user.uid;
    const data = await SettingService.getAll(userId);
    responseHttp(reply, 200, "Ok", { data: data });
  }

  async getByMultiKey(request, reply) {
    const data = await SettingService.getByMultiKey("allow_register");
    return reply
      .code(200)
      .header(`Content-Type`, `application/json; charset=utf-8`)
      .send(data);
  }
}

module.exports = new SettingController();
