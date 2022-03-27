const SettingService = require(`../services/setting.service`);
const ProfileService = require(`../services/profile.service`);
const { responseHttp } = require("../utils/http.utils");

class AppController {

  async getById(request, reply) {
    const data = await SettingService.getByMultiKey();
    responseHttp(reply, 200, "Ok", { data: data.length > 0 ? data[0] : null });
  }

  async getUserSetting(request, reply) {
    const userId = request.user.uid;
    const data = await ProfileService.getUserProfile(
      userId
    );
    responseHttp(reply, 200, "Ok", { data: data });
  }
}

module.exports = new AppController();
