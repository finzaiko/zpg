const ProfileConnDto = require("../dtos/profile-conn.dto");
const ProfileContentDto = require("../dtos/profile-content.dto");
const ProfileRepository = require(`../repositories/profile.repository`);

class ProfileService {
  async findAll(type, userId, isList, showAll, limit, offset, search) {
    if(typeof limit=="undefined"){
      limit = 100;
    }
    return await ProfileRepository.findAll(type, userId, isList, showAll, limit, offset, search);
  }

  async getById(id, type, userId) {
    const data = await ProfileRepository.getById(id, type, userId);
    return data[0];
  }

  async check(id, type, db, userId) {
    const profile = await ProfileRepository.getById(id, type, userId);
    // console.log(`profile`, profile);
    const newData = {
      conn_name: db,
      user_id: userId,
      type: type,
      host: profile[0].host,
      port: profile[0].port,
      database: db,
      user: profile[0].user,
      password: profile[0].password,
    };
    const data = await ProfileRepository.check(newData);
    const check = data.data<=0;
    if(check){
      this.createConn(newData)
    }
    return check;
  }

  async createConn(data) {
    let profileConnDto = new ProfileConnDto();
    profileConnDto.conn_name = data.conn_name;
    profileConnDto.host = data.host;
    profileConnDto.port = data.port;
    profileConnDto.database = data.database;
    profileConnDto.user = data.user;
    profileConnDto.password = data.password;
    profileConnDto.type = data.type;
    profileConnDto.ssl = data.ssl;
    profileConnDto.user_id = data.user_id;

    return await ProfileRepository.createConn(profileConnDto);
  }

  async updateConn(id, data) {
    let profileConnDto = new ProfileConnDto();
    profileConnDto.conn_name = data.conn_name;
    profileConnDto.host = data.host;
    profileConnDto.port = data.port;
    profileConnDto.database = data.database;
    profileConnDto.user = data.user;
    profileConnDto.password = data.password;
    profileConnDto.type = data.type;
    profileConnDto.ssl = data.ssl;
    profileConnDto.user_id = data.user_id;

    return await ProfileRepository.updateConn(id, profileConnDto);
  }

  async deleteConn(id) {
    return await ProfileRepository.deleteConn(id);
  }

  async testConn(data) {
    return await ProfileRepository.testConn(data);
  }

  async getContentAll(type, userId, isList) {
    return await ProfileRepository.findAll(type, userId, isList);
  }

  async createContent(data, userId) {
    let profileContentDto = new ProfileContentDto();
    profileContentDto.title = data.title;
    profileContentDto.content = data.content;
    profileContentDto.type = data.type;
    profileContentDto.user_id = userId;

    return await ProfileRepository.createContent(profileContentDto);
  }

  async updateContent(id, data, userId) {
    let profileContentDto = new ProfileContentDto();
    profileContentDto.title = data.title;
    profileContentDto.content = data.content;
    profileContentDto.type = data.type;
    profileContentDto.user_id = userId;

    return await ProfileRepository.updateContent(id, profileContentDto);
  }

  async deleteContent(id, userId) {
    return await ProfileRepository.deleteContent(id);
  }

  async getUserProfile(userId) {
    const data = await ProfileRepository.getUserProfile(userId);
    return data;
  }


}
module.exports = new ProfileService();
