const SettingRepository = require(`../repositories/setting.repository`);

class SettingService {

  async getAll(userId) {
    const data = await SettingRepository.getAll(userId);
    return data;
  }
  
  async getByMultiKey(keys) {
    // console.log('keys>>>>',keys);
    
    const data = await SettingRepository.getByMultiKey(keys);
    // console.log('data>>>>',data);
    
    return data;
  }
}

module.exports = new SettingService();
