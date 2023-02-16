const CopydataRepository = require(`../repositories/copydata.repository`);
const PofileRepository = require("../repositories/profile.repository");
const BaseRepository = require(`../repositories/base.repository`);

const {
  getObjectKeyName,
  getSqlStringTypeFromArray,
} = require("../utils/string.utils");

class CopydataService {
  async runCopy(userId, bodyData) {
    const {
      type_copy,
      source_id,
      target_id,
      source_query,
      target_target,
      table_name,
      data_source,
      first_row,
      table_exist,
    } = bodyData;

    const ts = table_name.split(".");
    const schema = ts[0];
    const table = ts[1];

    if (type_copy == "query") {
      if (table_exist == 1) {
        const isTableExist = await BaseRepository.checkTableExist(
          target_id,
          userId,
          schema,
          table
        );
        // console.log("isTableExist", isTableExist.rows[0].exists);
        if (!isTableExist.rows[0].exists) {
          return { error: true, message: "Table not really exist" };
        } else {
          const tblType = await BaseRepository.getTableType(
            source_id,
            userId,
            schema,
            table
          );

          const sourceData = await BaseRepository.runQuery(
            source_id,
            userId,
            source_query
          );
          const sqlField = getObjectKeyName(sourceData.rows[0]);
          const fieldTypes = tblType.rows.filter((ob) =>
            sqlField.includes(ob.column_name)
          );

          const insertSql = getSqlStringTypeFromArray(
            sourceData.rows,
            schema,
            table,
            false,
            fieldTypes
          );
          // console.log("insertSql", insertSql);

          const result = await BaseRepository.runBatchQuery(target_id, userId, insertSql);
          console.log('result',result);


          return result
        }
      }

      return;

      //   if (table_exist == 1) {
      //     if (serverCfgSource.length == 0) {
      //       return "No source connection";
      //     }
      //     const pgPoolSource = new Pool(serverCfgTarget[0]);
      //     sourceData = pgPoolSource.query(source_query);
      //     console.log("sourceData>> ", sourceData);
      //   }
      // } else {
      //   return "Not implement yet";
      // }

      // return;
      // const serverCfgTarget = await PofileRepository.getById(
      //   target_id,
      //   1,
      //   userId
      // );
      // if (serverCfgTarget.length > 0) {
      //   const pgPool = new Pool(serverCfgTarget[0]);
      //   const client = await pgPool.connect();
      //   try {
      //     const ts = table_name.split(".");
      //     const schema = ts[0];
      //     const table = ts[1];
      //   } catch (e) {
      //     await client.query("ROLLBACK");
      //     throw e;
      //   } finally {
      //     client.release();
      //   }
      // }
    }
  }
}
module.exports = new CopydataService();
