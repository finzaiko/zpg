const {
  getPrimaryKeyByTableName,
} = require("../repositories/viewdata.repository");
const ViewdataRepository = require(`../repositories/viewdata.repository`);

class ViewdataService {
  async getTableData(profileId, userId, oid, limit, offset, filter, sort) {
    const tblName = await ViewdataRepository.getTableNameByOid(
      profileId,
      userId,
      oid
    );
    const { tableschema, tablename } = tblName.rows[0];

    const tblType = await ViewdataRepository.getTableType(
      profileId,
      userId,
      tableschema,
      tablename
    );

    const tblTypes = tblType.rows;

    const dataPk = await getPrimaryKeyByTableName(
      profileId,
      userId,
      tableschema,
      tablename
    );

    let pk = "";
    if (dataPk.rows.length > 0) {
      pk = dataPk.rows[0].attname;
    } else {
      if (tblTypes.length > 0) {
        pk = tblTypes[0].column_name;
      }
    }

    let whereStr = "";
    if (typeof filter != "undefined") {
      let w = [];
      for (const [key, value] of Object.entries(filter)) {
        if (value != "") {
          const tt = tblTypes.find((tp) => tp.column_name == key);
          switch (tt.data_type) {
            case "integer":
            case "boolean":
              w.push(`${key} = ${value}`);
              break;
            default:
              w.push(`${key} ILIKE '%${value}%'`);
              break;
          }
        }
      }
      whereStr = w.join(" AND ");
    }

    let sortStr = "";
    if (typeof sort != "undefined") {
      let s = [];
      for (const [key, value] of Object.entries(sort)) {
        if (value != "") {
          s.push(`${key} ${value}`);
        }
      }
      sortStr = s.join(" ");
    }

    const tblData = await ViewdataRepository.getTableData(
      profileId,
      userId,
      tableschema,
      tablename,
      limit,
      offset,
      whereStr,
      sortStr,
      pk
    );

    let ttlCount = 0;
    if (tblData.rows.length > 0) {
      ttlCount = tblData.rows[0].total_count;
    }
    return { tblType, tblData, total_count: ttlCount };
  }

  async updateTableData(userId, bodyData) {
    const profileId = bodyData.source_id;
    const tblName = await ViewdataRepository.getTableNameByOid(
      profileId,
      userId,
      bodyData.oid
    );
    const { tableschema, tablename } = tblName.rows[0];

    const tblType = await ViewdataRepository.getTableType(
      profileId,
      userId,
      tableschema,
      tablename
    );
    const tblTypes = tblType.rows;

    const dataPk = await getPrimaryKeyByTableName(
      profileId,
      userId,
      tableschema,
      tablename
    );

    let pk = "";
    if (dataPk.rows.length > 0) {
      pk = dataPk.rows[0].attname;
    } else {
      if (tblTypes.length > 0) {
        pk = tblTypes[0].column_name;
      }
    }

    let dataInput = bodyData.data;
    const pkValue = dataInput[pk];
    let result;

    delete dataInput[pk];
    if (typeof dataInput != "undefined") {
      let fieldValue = [];
      for (const [key, value] of Object.entries(dataInput)) {
        const tt = tblTypes.find((tp) => tp.column_name == key);
        if (typeof tt != "undefined") {
          switch (tt.data_type) {
            case "integer":
            case "boolean":
              fieldValue.push(`${key}=${value}`);
              break;
            default:
              if (value === null) {
                fieldValue.push(`${key}=${value}`);
              } else {
                fieldValue.push(`${key}='${value}'`);
              }
              break;
          }
        }
      }
      const fieldValueSql = fieldValue.join(`,
      `);
      let sqlStr = `UPDATE ${tableschema}.${tablename} SET
      ${fieldValueSql} WHERE ${pk}=${pkValue}`;
      const tblData = await ViewdataRepository.updateTableData(
        profileId,
        userId,
        sqlStr
      );
      result = tblData;
    }
    return result;
  }
}
module.exports = new ViewdataService();
