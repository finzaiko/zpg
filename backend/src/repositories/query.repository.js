const ProfileRepository = require(`./profile.repository`);
const { Pool } = require("pg");
const types = require('pg').types

class QueryRepository {
  async runSQL(profileId, sql, userId, callback) {
    const serverCfg = await ProfileRepository.getById(profileId, 1, userId);

    // stop pg from parsing dates and timestamps without timezone
    // const TIMESTAMPTZ_OID = 1184
    // const TIMESTAMP_OID = 1114
    // types.setTypeParser(TIMESTAMP_OID, function(stringValue) {
    //   return new Date(stringValue + '+0000');
    // });
    // types.setTypeParser(TIMESTAMPTZ_OID, function(stringValue) {
    //   return new Date(stringValue + '+0000');
    // });

    const SQLDatetimeTypes = [1082, 1083, 1114, 1184, 1182, 1266];
    SQLDatetimeTypes.forEach(function (type) {
      types.setTypeParser(type, function (val) { return val; });
    });
    // Do not do any parsing for postgreSQL interval type
    types.setTypeParser(1186, function (val) { return val; });


    const pgPool = new Pool(serverCfg[0]);

    pgPool.on("connect", (client) => {
      client.on("notice", (msg) => {
        callback(msg);
      });
    });
    // return pgPool.query(sql, function(err, result) {
    //   // if (!result) {
    //   //   console.log(err);
    //   //   cb([], err);
    //   // } else {
    //   //   cb(result.rows, err);
    //   // }
    //   console.log('err>>>>> ',err);
    //   console.log('result>>>>> ',result);

    // })
    // return pgPool.query(sql)
    return pgPool.query({
      rowMode: 'array',
      text: sql,
    })
  }

  async getQueryDataType(profileId, userId, runSql) {
    const serverCfg = await ProfileRepository.getById(profileId, 1, userId);
    if (serverCfg.length > 0) {
      const pgPool = new Pool(serverCfg[0]);
      const sql = `
        DROP TABLE IF EXISTS z_temp;
        CREATE TEMPORARY TABLE z_temp AS
        ${runSql};
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'z_temp';
        -- DROP TABLE IF EXISTS z_temp;
      `;
      const a= pgPool.query(sql);
      return a;
    }
    return [];
  }
}

module.exports = new QueryRepository();
