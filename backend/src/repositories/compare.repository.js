const { db } = require("../core/database");
const ProfileRepository = require(`./profile.repository`);
const { Pool } = require("pg");
const {
  schemaList,
  schemaInfo,
  diffDetail,
  contentDiff,
} = require("../core/sql/compare.sql");

class CompareRepository {
  async getSchemaList(profileId, userId) {
    const serverCfg = await ProfileRepository.getById(profileId, 1, userId);
    if (serverCfg.length > 0) {
      const pgPool = new Pool(serverCfg[0]);
      return pgPool.query(schemaList);
    }
    return [];
  }

  async getSchemaInfo(profileId, userId, schema, isShowTable, oidArr) {
    const serverCfg = await ProfileRepository.getById(profileId, 1, userId);

    if (serverCfg.length > 0) {
      const pgPool = new Pool(serverCfg[0]);
      return pgPool.query(schemaInfo(schema, oidArr, isShowTable));
    }
    return [];
  }

  async getDiffDetail(
    profileId,
    userId,
    oid,
    schema,
    funcName,
    retType,
    paramsIn
  ) {
    const serverCfg = await ProfileRepository.getById(profileId, 1, userId);
    if (serverCfg.length > 0) {
      const pgPool = new Pool(serverCfg[0]);
      return pgPool.query(diffDetail(schema, oid, funcName, retType, paramsIn));
    }
    return [];
  }

  async getContentDiff(profileId, userId, schemaTableName, type, oid) {
    const serverCfg = await ProfileRepository.getById(profileId, 1, userId);
    if (serverCfg.length > 0) {
      const pgPool = new Pool(serverCfg[0]);
      return pgPool.query(contentDiff(schemaTableName, oid, type));
    }
    return [];
  }
}

module.exports = new CompareRepository();
