const ProfileRepository = require(`./profile.repository`);
const { Pool } = require("pg");
const async = require("async");

class BaseRepository {
  async runQuery(profileId, userId, sql) {
    const serverCfg = await ProfileRepository.getById(profileId, 1, userId);

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
      let result = { error: false, message: "Copy success" };
      try {
        async.eachSeries(
          sql,
          (query, next) => {
            //console.log(`Running query: ${query}`);
            client.query(query, (err, results) => {
              if (err) {
                console.log("ERROR: ", err);
                result = { error: true, message: ""+err };
              }
            });
            next();
          },
          () => {
            console.log("Done..");
          }
        );

        const commit = await client.query("COMMIT");
        // console.log('commit>>>>>> ',commit);

      } catch (e) {

        await client.query("ROLLBACK");
        // throw e;
        result =  { error: true, message: "Copy fail" };
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