const { db } = require("../core/database");
const ProfileRepository = require(`./profile.repository`);
const { Pool } = require("pg");
const async = require("async");
// const {
//   schemaList,
// } = require("../core/sql/compare.sql");

class ViewdataRepository {
  async getTableNameByOid(profileId, userId, oid) {
    const serverCfg = await ProfileRepository.getById(profileId, 1, userId);
    if (serverCfg.length > 0) {
      const pgPool = new Pool(serverCfg[0]);

      const sql = `select
            n.nspname AS tableschema,
            c.relname AS tablename
        from pg_class c
        inner join pg_namespace n on (c.relnamespace = n.oid)
        where c.relfilenode = ${oid}`;
        console.log('sql',sql);

      return pgPool.query(sql);
    }
    return [];
  }

  async getPrimaryKeyByTableName(profileId, userId, schema, table){
    const serverCfg = await ProfileRepository.getById(profileId, 1, userId);
    if (serverCfg.length > 0) {
      const pgPool = new Pool(serverCfg[0]);
      const sql = `SELECT a.attname
          FROM   pg_index i
          JOIN   pg_attribute a ON a.attrelid = i.indrelid
                              AND a.attnum = ANY(i.indkey)
          WHERE  i.indrelid = '${schema}.${table}'::regclass
          AND    i.indisprimary`;
          return pgPool.query(sql);
    }
    return [];
  }

  async getTableData(profileId, userId, schema, table, limit, offset, whereStr, sortStr, pk) {
    if (typeof limit == "undefined") {
      limit = 30;
    }
    if (typeof offset == "undefined") {
      offset = 0;
    }
    const serverCfg = await ProfileRepository.getById(profileId, 1, userId);
    if (serverCfg.length > 0) {
      const pgPool = new Pool(serverCfg[0]);
      let sqlWhere = '';
      if(whereStr!=""){
        sqlWhere = ` WHERE ${whereStr} `
      }
      let sqlSort = '';
      if(sortStr!=""){
        sqlSort = ` ORDER BY ${sortStr} `
      }else{
        if(pk!=""){
          sqlSort = ` ORDER BY ${pk} desc `
        }
      }
      let sql = `SELECT *, (COUNT(*) OVER())::int AS total_count FROM ${schema}.${table}`;
      sql += ` ${sqlWhere} `;
      sql += ` ${sqlSort} `;
      sql += ` LIMIT ${limit} OFFSET ${offset}`;
      // console.log(`sqlllllll`, sql);
      return pgPool.query(sql);
    }
    return [];
  }

  async getTableType(profileId, userId, schema, table) {
    const serverCfg = await ProfileRepository.getById(profileId, 1, userId);
    if (serverCfg.length > 0) {
      const pgPool = new Pool(serverCfg[0]);
      const sql = `
      select column_name, REPLACE(data_type,'character varying','varchar') as data_type
      from information_schema.columns
      where table_schema='${schema}' and table_name = '${table}';
      `;
      // console.log(`sql/////////////////`, sql);
      return pgPool.query(sql);
    }
    return [];
  }

  async updateTableData(profileId, userId, sqlStr) {
    const serverCfg = await ProfileRepository.getById(profileId, 1, userId);
    if (serverCfg.length > 0) {
      const pgPool = new Pool(serverCfg[0]);
      return pgPool.query(sqlStr);
    }
    return [];
  }

  async updateTableResult(profileId, userId, tableName, data) {
    const serverCfg = await ProfileRepository.getById(profileId, 1, userId);
    if (serverCfg.length > 0) {
      const pgPool = new Pool(serverCfg[0]);
      const client = await pgPool.connect()
      try {

        const ts = tableName.split('.');
        const schema = ts[0]
        const table = ts[1]

        await client.query('BEGIN')
        let sqlAll = [];
        JSON.parse(data).forEach(o=>{

          // update table
          if(o.id>0){
            const inputColName = o.column;
            const colName = inputColName.substring(0, inputColName.lastIndexOf('_'));
            const oneSql = `UPDATE ${schema}.${table} SET ${colName}='${o.value}' WHERE id=${o.id_db};`;
            sqlAll.push(oneSql);
          }else{ // insert table
            let field = [], val = [];
            Object.entries(o).forEach(entry => {
              const [key, value] = entry;
              console.log(key, value);
              if(key!="id"){
                const colName = key.substring(0, key.lastIndexOf('_'));
                field.push(colName);
                val.push(`'${value}'`);
              }
            });
            const sqlField = field.join(',');
            const sqlValue = val.join(',');
            const oneSql = `INSERT INTO ${schema}.${table} (${sqlField}) VALUES (${sqlValue});`;
            sqlAll.push(oneSql);
          }
        });

        const dataPk = await this.getPrimaryKeyByTableName(profileId, userId, schema, table);
        let pk = "";
        if(dataPk.rows.length>0){
          pk = dataPk.rows[0].attname;
        }else{
          if(tblTypes.length>0){
            pk = tblTypes[0].column_name;
          }
        }

        if(pk!="id"){
          console.log('PK name not ID');
          return;
        }

        async.eachSeries(
          sqlAll,
          (query, next) => {
            console.log(`Running query: ${query}`);
            client.query(query, (err, results) => {
              if(err){
                console.log('ERROR: ',err);
              }
            });
            next();
          },
          () => {
            console.log("Done..");
          });

        await client.query('COMMIT')
      } catch (e) {
        await client.query('ROLLBACK')
        throw e
      } finally {
        client.release()
      }
    }
    return [];
  }

  async getIsTable(profileId, userId, schema, table) {
    const serverCfg = await ProfileRepository.getById(profileId, 1, userId);
    if (serverCfg.length > 0) {
      console.log('hereeee2');
      const pgPool = new Pool(serverCfg[0]);
      const sql = `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '${schema}' and table_name = '${table}') as data;`;
      return pgPool.query(sql);
    }
    return [];
  }
}

module.exports = new ViewdataRepository();
