const { db } = require("../core/database");
const ProfileRepository = require(`./profile.repository`);
const { Pool } = require("pg");

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
}

module.exports = new ViewdataRepository();
