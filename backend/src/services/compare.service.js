const CompareRepository = require(`../repositories/compare.repository`);

class CompareService {
  async getSchemaList(profileId, userId) {
    return await CompareRepository.getSchemaList(profileId, userId);
  }

  async getSchemaInfo(profileId, userId, schema, isShowTable, oidArr) {
   return await CompareRepository.getSchemaInfo(profileId, userId, schema, isShowTable, oidArr);
  }

  async getDiffDetail(profileId, userId, oid, schema, funcName, retType, paramsIn) {
    return await CompareRepository.getDiffDetail(profileId, userId, oid, schema, funcName, retType, paramsIn);
  }

  async getContentDiff(profileId, userId, schemaTableName, type, oid) {
    return await CompareRepository.getContentDiff(profileId, userId, schemaTableName, type, oid);
  }
}
module.exports = new CompareService();
