const { ENCRYPT_PASSWORD } = require("../config/contant");
const DbRepository = require(`../repositories/db.repository`);

const { encrypt } = require("../utils/webcrypto.util");

class DbService {
  async getAll(profileId, userId, typeLevel) {
    return await DbRepository.getAll(profileId, userId, typeLevel);
  }

  async getCompletionList(profileId, userId) {
    return await DbRepository.getCompletionList(profileId, userId);
  }

  async getSchemaContent(
    profileId,
    schema,
    isShowTable,
    isTarget,
    oidArr,
    userId
  ) {
    return await DbRepository.getSchemaContent(
      profileId,
      schema,
      isShowTable,
      isTarget,
      oidArr,
      userId
    );
  }
  async getSchemaTree(profileId, rootId, dbOid, userId, typeLevel) {
    return await DbRepository.getSchemaTree(
      profileId,
      rootId,
      dbOid,
      userId,
      typeLevel
    );
  }
  async getSchemaContentTree(
    profileId,
    baseRootIdOid,
    dbOid,
    userId,
    typeLevel
  ) {
    return await DbRepository.getSchemaContentTree(
      profileId,
      baseRootIdOid,
      dbOid,
      userId,
      typeLevel
    );
  }
  async getContentSearch(profileId, baseRootIdOid, search, userId, type, view) {
    return await DbRepository.getContentSearch(
      profileId,
      baseRootIdOid,
      search,
      userId,
      type,
      view
    );
  }
}
module.exports = new DbService();
