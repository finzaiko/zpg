const ProfileRepository = require(`./profile.repository`);
const { Pool } = require("pg");
const async = require("async");

class BaseRepository {
  async runQuery(profileId, userId, sql, dbName) {
    let serverCfg = await ProfileRepository.getById(profileId, 1, userId);

    if(typeof dbName!="undefined" && dbName!=""){
      serverCfg[0].database = dbName;
    }

    if (serverCfg.length == 0) {
      return { error: true, message: "No source connection" };
    }
    const pgPoolSource = new Pool(serverCfg[0]);
    return pgPoolSource.query(sql);
  }

  async getTableType(profileId, userId, schema, table) {
    const sql = `
        select column_name, REPLACE(data_type,'character varying','varchar') as data_type
        from information_schema.columns
        where table_schema='${schema}' and table_name = '${table}';
      `;
      console.log('sql>>>>',sql);

    return this.runQuery(profileId, userId, sql);
  }

  async checkTableExist(profileId, userId, schema, table) {
    const sql = `SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = '${schema}' AND tablename  = '${table}')`;
    return this.runQuery(profileId, userId, sql);
  }

  async runBatchQuery(target_id, userId, sql) {
    const serverCfgTarget = await ProfileRepository.getById(
      target_id,
      1,
      userId
    );
    if (serverCfgTarget.length > 0) {
      const pgPool = new Pool(serverCfgTarget[0]);
      const client = await pgPool.connect();
      let result = { error: false, message: "Success execute" };

      try {
        await client.query("BEGIN");
        // console.log(`LOG:Running query /////////////////////`);
        async.eachSeries(
          sql,
          (query, next) => {
            // LOG:Running query
            // console.log(query);
            client.query(query, (err, results) => {
              if (err) {
                // console.log("ERROR: ", err);
                result = { error: true, message: "" + err };
              }
            });
            next();
          },
          () => {
            console.log("Done..");
          }
        );
        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK");
        // throw e;
        result = { error: true, message: "Fail" };
      } finally {
        client.release();
        return result;
      }
    } else {
      return { error: false, message: "No connection batch query" };
    }
  }

}

module.exports = new BaseRepository();
