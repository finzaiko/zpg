const SettingRepository = require(`../repositories/setting.repository`);

class SettingService {

  async getAll(userId) {
    const data = await SettingRepository.getAll(userId);
    return data;
  }
  
  async getByMultiKey(keys) {
    const data = await SettingRepository.getByMultiKey(keys);
    return data;
  }
}

module.exports = new SettingService();
