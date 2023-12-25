const CompareRepository = require(`../repositories/compare.repository`);

class CompareService {
  async getSchemaList(profileId, userId) {
    return await CompareRepository.getSchemaList(profileId, userId);
  }

  async getSchemaInfo(profileId, userId, schema, filter, oidArr) {
    return await CompareRepository.getSchemaInfo(
      profileId,
      userId,
      schema,
      filter,
      oidArr
    );
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
    return await CompareRepository.getDiffDetail(
      profileId,
      userId,
      oid,
      schema,
      funcName,
      retType,
      paramsIn
    );
  }

  async getContentDiff(profileId, userId, schemaTableName, type, oid) {
    const contentDef = await CompareRepository.getContentDiff(
      profileId,
      userId,
      schemaTableName,
      type,
      oid
    );

    const dropDef = await CompareRepository.getDropDefenition(
      profileId,
      userId,
      type,
      oid
    );
    return { content_def: contentDef.rows[0], drop_def: dropDef.rows[0] };
  }

  async createTempTable(dataA, dataB) {
    await CompareRepository.createTemp("tbl_a", dataA);
    const b = await CompareRepository.createTemp("tbl_b", dataB);
    return b;
  }

  async getDiff() {
    return await CompareRepository.getDiff();
  }

  async getContentRowCount(profileId, userId, exludeShema, schema) {
    const data = await CompareRepository.getContentRowCount(
      profileId,
      userId,
      exludeShema,
      schema
    );

    return data.slice(-1)[0];
  }
}
module.exports = new CompareService();
