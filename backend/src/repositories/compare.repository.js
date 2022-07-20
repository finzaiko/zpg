const { db, dbCompare } = require("../core/database");
const ProfileRepository = require(`./profile.repository`);
const { Pool } = require("pg");
const {
  schemaList,
  schemaInfo,
  diffDetail,
  contentDiff,
  countRowTable,
  compareDefenition,
  dropSqlDefenition,
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

  async getSchemaInfo(profileId, userId, schema, filter, oidArr) {
    const serverCfg = await ProfileRepository.getById(profileId, 1, userId);

    if (serverCfg.length > 0) {
      const pgPool = new Pool(serverCfg[0]);
      return pgPool.query(schemaInfo(schema, oidArr, filter));
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

  async getDropDefenition(profileId, userId, type, oid) {
    const serverCfg = await ProfileRepository.getById(profileId, 1, userId);
    if (serverCfg.length > 0) {
      const pgPool = new Pool(serverCfg[0]);
      return pgPool.query(dropSqlDefenition(type, oid));
    }
    return [];
  }

  async createTemp(tableName, data) {
    // console.log("INSERT tableName >> ", tableName);

    // console.log("data[0]>>>>>>>>>>", data);

    const listData = data.map((e) => Object.values(e));
    // console.log('listData',listData);

    const res = await new Promise((resolve, reject) => {
      // db.run(sql, params, (err, row) => {
      //   if (err) reject(err);
      //   resolve(row);
      // });
      var start = Date.now();
      // delete from sqlite_sequence where name='${tableName}';
      const sqlDelete = `
        DELETE FROM ${tableName};
      `;
      const sqlDelete2 = `
        UPDATE sqlite_sequence SET seq=0 WHERE name = '${tableName}';
      `;
      // console.log("sqlDelete", sqlDelete);

      dbCompare.run(sqlDelete);
      dbCompare.run(sqlDelete2);

      
      dbCompare.serialize(() => {
        let sql = `INSERT INTO ${tableName} (oid, z_schema, z_name, z_return, z_type, z_params_in, z_params_out, z_content) 
          VALUES (?, ?, ? ,?, ?, ?, ? ,?)`;
        // console.log("sql", sql);

        dbCompare.run("begin transaction");

        let statement = dbCompare.prepare(sql);

        // run the query over and over for each inner array
        for (var i = 0; i < listData.length; i++) {
          statement.run(listData[i], function (err) {
            if (err) throw err;
          });
        }

        // 'finalize' basically kills our ability to call .run(...) on the 'statement'
        // object again. Optional.
        statement.finalize();
        dbCompare.run("commit");
      });
      // dbCompare.close(function () {
      //   // sqlite3 has now fully committed the changes
      // });
      // console.log(">>>>>>>>>>>>>>>", Date.now() - start + "ms");
      resolve(true);
      // resolve(true);
    });
    return res;
  }

  async getDiff(type, offset, limit, sort, userId) {
    const res = await new Promise((resolve, reject) => {
      dbCompare.all(compareDefenition(), (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async getContentRowCount(profileId, userId, exludeShema, schema) {
    // console.log(
    //   "getContentRowCount-REPO>>>>",
    //   profileId,
    //   userId,
    //   exludeShema,
    //   schema
    // );

    const serverCfg = await ProfileRepository.getById(profileId, 1, userId);
    // console.log("serverCfg", serverCfg);

    if (serverCfg.length > 0) {
      // console.log("getContentRowCount-REPO2>>>>");
      const pgPool = new Pool(serverCfg[0]);
      return pgPool.query(countRowTable(exludeShema, schema));
    }
    // return [];
    throw new Error("Config connection not found");
  }
}

module.exports = new CompareRepository();
