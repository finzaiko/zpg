const CopydataRepository = require(`../repositories/copydata.repository`);

class CopydataService {
  async runCopy(userId, bodyData) {
    const { type_copy, source_id, table_name, first_row, data, table_exist } = bodyData;

    const tblData = await CopydataRepository.runCopy(
      type_copy,
      source_id,
      userId,
      table_name,
      first_row,
      data,
      table_exist
    );

    console.log("tblData", tblData);
  }
}
module.exports = new CopydataService();
