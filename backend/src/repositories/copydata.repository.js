const { db } = require("../core/database");
const ProfileRepository = require(`./profile.repository`);
const { Pool } = require("pg");
const async = require("async");

class CopydataRepository {
  async runCopy(type_copy, profileId, userId, table_name, first_row, data, table_exist) {
    const serverCfg = await ProfileRepository.getById(profileId, 1, userId);
    if (serverCfg.length > 0) {
      const pgPool = new Pool(serverCfg[0]);
      const client = await pgPool.connect();
      try {
        const ts = table_name.split(".");
        const schema = ts[0];
        const table = ts[1];

        // await client.query('BEGIN')

        let sqlAll = "";
        if (type_copy == "query") {

          if(table_exist==1){

          }
          // TODO:

          let parsedData = JSON.parse(data);
          let sqlAll = [];
          parsedData.forEach((o) => {
            console.log("o", o);

            let field = [],
              val = [];
            Object.entries(o).forEach((entry) => {
              const [key, value] = entry;
              // console.log(key, value);
              field.push(key);
              val.push(`'${value}'`);
            });

            let sqlField = field.join(",");
            if (first_row) {
              sqlField = frName.join(",");
            }

            const sqlValue = val.join(",");
            const oneSql = `INSERT INTO ${schema}.${table} (${sqlField}) VALUES (${sqlValue});`;
            sqlAll.push(oneSql);
          });
          console.log('sqlAll',sqlAll);

        } else {
          sqlAll = this.getSqlSpreadsheetType(
            data,
            schema,
            table,
            first_row
          );
        }

        console.log("sqlAll", sqlAll);
        return; // test
        async.eachSeries(
          sqlAll,
          (query, next) => {
            console.log(`Running query: ${query}`);
            client.query(query, (err, results) => {
              if (err) {
                console.log("ERROR: ", err);
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
        throw e;
      } finally {
        client.release();
      }
    }
    return [];
  }

  async getIsTable(profileId, userId, schema, table) {
    const serverCfg = await ProfileRepository.getById(profileId, 1, userId);
    if (serverCfg.length > 0) {
      console.log("hereeee2");
      const pgPool = new Pool(serverCfg[0]);
      const sql = `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '${schema}' and table_name = '${table}') as data;`;
      return pgPool.query(sql);
    }
    return [];
  }

  getSqlSpreadsheetType(data, schema, table, first_row) {
    let parsedData = JSON.parse(data);
    let frName;
    if (first_row) {
      frName = Object.values(parsedData[0]);
      parsedData.shift();
    }
    let sqlAll = [];
    parsedData.forEach((o) => {
      console.log("o", o);

      let field = [],
        val = [];
      Object.entries(o).forEach((entry) => {
        const [key, value] = entry;
        // console.log(key, value);
        field.push(key);
        val.push(`'${value}'`);
      });

      let sqlField = field.join(",");
      if (first_row) {
        sqlField = frName.join(",");
      }

      const sqlValue = val.join(",");
      const oneSql = `INSERT INTO ${schema}.${table} (${sqlField}) VALUES (${sqlValue});`;
      sqlAll.push(oneSql);
    });
    return sqlAll;
  }
}

module.exports = new CopydataRepository();
