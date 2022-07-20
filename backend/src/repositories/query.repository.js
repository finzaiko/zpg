const ProfileRepository = require(`./profile.repository`);
const { Pool } = require("pg");

class QueryRepository {
  async runSQL(profileId, sql, userId, callback) {
    const serverCfg = await ProfileRepository.getById(profileId, 1, userId);
    // console.log(`serverCfggggggggggggggggggg>>`, serverCfg);
    const pgPool = new Pool(serverCfg[0]);
    pgPool.on("connect", (client) => {
      client.on("notice", (msg) => {
        callback(msg);
      });
    });
    return pgPool.query(sql)
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
