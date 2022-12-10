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

    // console.log(`tblType//////////`, tblType);
    // console.log(`tblType-rows//////////`, tblType.rows);
    const tblTypes = tblType.rows;

    // console.log(`tblTypes>>>>>>`, tblTypes);

    // console.log(`filter>>>>>>`, filter);
    //  console.log(`sort>>>>>>`, sort);

    const dataPk = await getPrimaryKeyByTableName(
      profileId,
      userId,
      tableschema,
      tablename
    );
    // console.log(`dataPk.rows`, dataPk.rows);
    // const pk = dataPk.rows[0].attname;

    let pk = "";
    if(dataPk.rows.length>0){
      pk = dataPk.rows[0].attname;
    }else{
      if(tblTypes.length>0){
        pk = tblTypes[0].column_name;
      }
    }

    // console.log(`pkkkkkk`, pk);

    let whereStr = "";
    if (typeof filter != "undefined") {
      let w = [];
      for (const [key, value] of Object.entries(filter)) {
        // console.log(`***${key}: ${value}`);
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
        // console.log(`***${key}: ${value}`);
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

    // console.log(`tblData//////////`, tblData);

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
    if(dataPk.rows.length>0){
      pk = dataPk.rows[0].attname;
    }else{
      if(tblTypes.length>0){
        pk = tblTypes[0].column_name;
      }
    }

    // const pk = dataPk.rows[0].attname;
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
              if(value===null){
                fieldValue.push(`${key}=${value}`);
              }else{
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
      // console.log(`sql******`, sqlStr);
      const tblData = await ViewdataRepository.updateTableData(
        profileId,
        userId,
        sqlStr
      );
      result = tblData;
    }
    return result;
  }


  async saveResult(userId, bodyData) {
    const { source_id, table_name, data } = bodyData;

    const ts = table_name.split('.');
    const tableschema = ts[0]
    const tablename = ts[1]

    const tblType = await ViewdataRepository.getTableType(
      source_id,
      userId,
      tableschema,
      tablename
    );
    const tblTypes = tblType.rows;

    const dataPk = await getPrimaryKeyByTableName(
      source_id,
      userId,
      tableschema,
      tablename
    );


    let sqlStr = '';
    JSON.parse(data).forEach(o=>{
      console.log('o',o);

      const col = (o.column).split(".")[0];
      // update table
      if(o.id>0){
        sqlStr = `UPDATE ${tableschema}.${tablename} SET ${col}='${o.value}' WHERE ${pk}=${o.id_db}`;
        // console.log(`sql******`, sqlStr);
      }else{

      }
    })
    const tblData = await ViewdataRepository.updateTableData(
      profileId,
      userId,
      sqlStr
    );

    return;
    let pk = "";
    if(dataPk.rows.length>0){
      pk = dataPk.rows[0].attname;
    }else{
      if(tblTypes.length>0){
        pk = tblTypes[0].column_name;
      }
    }

    // const pk = dataPk.rows[0].attname;
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
              if(value===null){
                fieldValue.push(`${key}=${value}`);
              }else{
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
      // console.log(`sql******`, sqlStr);
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
