const { ENCRYPT_PASSWORD } = require("../config/contant");
const ProfileConnDto = require("../dtos/profile-conn.dto");
const ProfileContentDto = require("../dtos/profile-content.dto");
const ProfileRepository = require(`../repositories/profile.repository`);
const { encrypt, decrypt } = require("../utils/webcrypto.util");

class ProfileService {
  async findAll(type, userId, isList, showAll, limit, offset, search) {
    if (typeof limit == "undefined") {
      limit = 100;
    }
    if (typeof offset == "undefined") {
      offset = 0;
    }
    if (typeof showAll == "undefined") {
      showAll = 0;
    }
    return await ProfileRepository.findAll(
      type,
      userId,
      isList,
      showAll,
      limit,
      offset,
      search
    );
  }

  async countAll(type, userId, isList, showAll, limit, offset, search) {
    if (typeof limit == "undefined") {
      limit = 100;
    }
    if (typeof offset == "undefined") {
      offset = 0;
    }
    if (typeof showAll == "undefined") {
      showAll = 0;
    }
    return await ProfileRepository.countAll(
      type,
      userId,
      isList,
      showAll,
      limit,
      offset,
      search
    );
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
    const check = data.data <= 0;
    if (check) {
      this.createConn(newData);
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
    profileConnDto.content = data.content;

    return await ProfileRepository.createConn(profileConnDto);
  }

  async updateQue(userId, data) {
    const inputData = JSON.parse(data.data);
    let sqlStr = [];
    inputData.forEach((obj) => {
      const oneSql = `UPDATE profile SET seq=${obj.seq} WHERE id=${obj.id};`;
      sqlStr.push(oneSql);
    });
    const result = await ProfileRepository.updateSequence(inputData);
    return { result };
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
    profileConnDto.content = data.content;

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

  async getExport(userId) {
    const secretData = await ProfileRepository.getExportData(userId);
    return await encrypt(JSON.stringify(secretData), ENCRYPT_PASSWORD);
  }

  async setImport(userId, data) {
    const { dbconn, overwrite } = data;
    const plainObj = await decrypt(dbconn, ENCRYPT_PASSWORD);
    const secretData = await ProfileRepository.setImportData(
      userId,
      overwrite,
      plainObj
    );
    return secretData;
  }
}
module.exports = new ProfileService();
