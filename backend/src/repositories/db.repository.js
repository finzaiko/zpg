const { db } = require("../core/database");
const ProfileRepository = require(`./profile.repository`);
const { Pool } = require("pg");
const {
  dbAll,
  dbSchemaAll,
  dbAllByOid,
  dbSchemaAllByOid,
  dbAllFunc,
  dbAllFuncBySchema,
  dbAllTableBySchema,
  dbFuncContentByOid,
  dbTableContentByOid,
  dbFuncTableSearch,
  dbTableContentByOid2,
  dbAllFuncTriggerBySchema,
  dbAllViewsBySchema,
  dbViewContentByOid,
  dbFuncTriggerContentByOid,
  dbTriggerContentByOid,
  dbTableMoreOptions,
  dbTableTriggerContent,
  dbTableConstraintDefenition,
  dbTableTriggerDefenition,
  dbTableConstraintContent,
  dbTableIndexDefenition,
  dbTableIndexContent,
  dbAllTypesBySchema,
  dbTypeContentByOid,
} = require("../core/sql/db.sql");

class DbRepository {
  async getAll(profileId, userId, typeLevel) {
    const serverCfg = await ProfileRepository.getById(
      profileId,
      1,
      userId,
      typeLevel
    );
    if (serverCfg.length > 0) {
      const pgPool = new Pool(serverCfg[0]);
      if (typeof typeLevel != "undefined" && typeLevel == 1) {
        return pgPool.query(dbSchemaAll);
      } else {
        return pgPool.query(dbAll);
      }
    }
    return [];
  }

  async getAllSchema(profileId, userId) {
    const serverCfg = await ProfileRepository.getById(profileId, 1, userId);
    if (serverCfg.length > 0) {
      const pgPool = new Pool(serverCfg[0]);
      return pgPool.query(dbSchemaAll);
    }
    return [];
  }

  async getSchemaContent(
    profileId,
    schema,
    isShowTable,
    isTarget,
    oidArr,
    userId
  ) {
    const serverCfg = await ProfileRepository.getById(profileId, 2, userId);
    const pgPool = new Pool(serverCfg[0]);
    const r = await pgPool.query(dbAllFunc(null, oidArr));
    return r.rows;
  }

  async getSchemaTree(profileId, rootId, dbOid, userId, typeLevel) {
    const serverCfg = await ProfileRepository.getById(profileId, 1, userId);
    let cfg = serverCfg[0];
    let schemaName = "";
    let sql = "";

    const pgPool = new Pool(cfg);
    const pg1 = await pgPool.query(dbAllByOid(rootId.split("_")[0]));

    if (typeof typeLevel != "undefined" && typeLevel == 0) {
      cfg.database = pg1.rows[0].datname;
    }

    const pgPool2 = new Pool(cfg);

    if (dbOid.split("_")[1] == "t" || dbOid.split("_")[1] == "f") {
      const schema = await pgPool2.query(dbSchemaAllByOid(dbOid.split("_")[0]));
      schemaName = schema.rows[0].nspname;
    }

    if (dbOid.split("_")[1] == "d") {
      sql = dbSchemaAll;
    } else if (dbOid.split("_")[1] == "f") {
      sql = dbAllFuncBySchema(schemaName);
    } else if (dbOid.split("_")[1] == "t") {
      sql = dbAllTableBySchema(schemaName);
    } else if (dbOid.split("_")[1] == "r") {
      sql = dbAllFuncTriggerBySchema(dbOid.split("_")[0]);
    } else if (dbOid.split("_")[1] == "v") {
      sql = dbAllViewsBySchema(dbOid.split("_")[0]);
    } else if (dbOid.split("_")[1] == "p") {
      sql = dbAllTypesBySchema(dbOid.split("_")[0]);
    } else if (dbOid.split("_")[1] == "u") {
      const newParent = dbOid.split("_")[0];
      sql = dbTableMoreOptions(newParent);
    } else if (dbOid.split("_")[1] == "u2") {
      const oidId = dbOid.split("_")[0];
      sql = dbTableConstraintDefenition(oidId);
    } else if (dbOid.split("_")[1] == "u21") {
      const oidId = dbOid.split("_")[0];
      sql = dbTableConstraintContent(oidId);
    } else if (dbOid.split("_")[1] == "u3") {
      const oidId = dbOid.split("_")[0];
      sql = dbTableIndexDefenition(oidId);
    } else if (dbOid.split("_")[1] == "u31") {
      const oidId = dbOid.split("_")[0];
      sql = dbTableIndexContent(oidId);
    } else if (dbOid.split("_")[1] == "u4") {
      const newParent = dbOid.split("_")[0];
      sql = dbTableTriggerDefenition(newParent);
    } else if (dbOid.split("_")[1] == "u41") {
      const newParent = dbOid.split("_")[0];
      sql = dbTableTriggerContent(newParent);
    } else {
      console.log("Not handled!");
    }
    // console.log("sql", sql);

    const r = await pgPool2.query(sql);
    return r.rows;
  }

  async getSchemaContentTree(profileId, baseRootIdOid, oid, userId, typeLevel) {
    const serverCfg = await ProfileRepository.getById(profileId, 1, userId);
    let cfg = serverCfg[0];

    if (baseRootIdOid != 0) {
      const pgPool = new Pool(cfg);
      const pg1 = await pgPool.query(dbAllByOid(baseRootIdOid.split("_")[0]));
      if (pg1.rows.length > 0) {
        cfg.database = pg1.rows[0].datname;
      }
    }

    const pgPool2 = new Pool(cfg);
    let mode = oid.split("_");
    let rsql = "";
    if (mode[1] == "g") {
      rsql = dbFuncContentByOid(mode[0]);
    } else if (mode[1] == "u") {
      rsql = dbTableContentByOid(mode[0]);
    } else if (mode[1] == "w") {
      rsql = dbFuncTriggerContentByOid(mode[0]);
    } else if (mode[1] == "y") {
      rsql = dbViewContentByOid(mode[0]);
    } else if (mode[1] == "p1") {
      rsql = dbTypeContentByOid(mode[0]);
    } else if (mode[1] == "u2" || mode[1] == "u3" || mode[1] == "u4") {
      rsql = `SELECT '-- No SQL selected object' as data`;
    } else if (mode[1] == "u21") {
      rsql = dbTableConstraintContent(mode[0]);
    } else if (mode[1] == "u31") {
      rsql = dbTableIndexContent(mode[0]);
    } else if (mode[1] == "u41") {
      rsql = dbTriggerContentByOid(mode[0], "tg_def");
    } else if (mode[1] == "u42") {
      rsql = dbTriggerContentByOid(mode[0], "tg_call");
    } else {
      return "";
    }
    // console.log('rsql',rsql);

    return pgPool2.query(rsql);
  }

  async getContentSearch(profileId, baseRootIdOid, search, userId, type, view) {
    const serverCfg = await ProfileRepository.getById(profileId, 1, userId);
    let cfg = serverCfg[0];
    if (baseRootIdOid != 0) {
      const pgPool = new Pool(cfg);
      const pg1 = await pgPool.query(dbAllByOid(baseRootIdOid.split("_")[0]));
      cfg.database = pg1.rows[0].datname;
    }

    const pgPool2 = new Pool(cfg);
    // search = search.replace(/'/g, "''");
    return pgPool2.query(dbFuncTableSearch(search, type, view));
  }

  async getSqlFunc(profileId, oid, userId) {
    const serverCfg = await ProfileRepository.getById(profileId, 1, userId);
    let cfg = serverCfg[0];
    const pgPool = new Pool(cfg);
    let commentDefinition = `
    (select func_def from
      (select CONCAT(
          'DROP FUNCTION IF EXISTS ',isr.specific_schema|| '.' ||  routine_name,'(',string_agg(isp.data_type::text,','),');',
          e'\n\n')
          as func_def,
          1 as s_no
          FROM information_schema.routines isr
          INNER JOIN pg_proc prc ON prc.oid = reverse(split_part(reverse(isr.specific_name), '_', 1))::int
          INNER JOIN information_schema.parameters isp ON isp.specific_name = isr.specific_name
          where prc.oid=${oid} AND parameter_mode='IN'
          group by routine_name, isr.specific_schema
        UNION ALL
        select CONCAT(
          'DROP FUNCTION IF EXISTS ',isr.specific_schema|| '.' ||  routine_name,'();',
          e'\n\n')
          as func_def,
          2 as s_no
          FROM information_schema.routines isr
          INNER JOIN pg_proc prc ON prc.oid = reverse(split_part(reverse(isr.specific_name), '_', 1))::int
          INNER JOIN information_schema.parameters isp ON isp.specific_name = isr.specific_name
          where prc.oid=${oid}
          group by routine_name, isr.specific_schema
        ) t order by s_no limit 1)
  `;

    let sqlPretty = `
      SELECT CONCAT_WS('',
        ${commentDefinition},
          (
          REPLACE(
            REPLACE(
              SPLIT_PART(
              pg_get_functiondef((SELECT oid FROM pg_proc WHERE oid = '${oid}')),
              E'\n', 1)
            ,',',E',\n\t')
          ,'(',E'(\n\t')
          )
          ,
          (REPLACE(
              pg_get_functiondef((SELECT oid FROM pg_proc WHERE oid = '${oid}')),
              split_part(pg_get_functiondef((SELECT oid FROM pg_proc WHERE oid = '${oid}')), E'\n', 1),
              ''
          ))
      ) AS sqlfunc;
    `;
    return pgPool.query(sqlPretty);
  }

  async runSql(profileId, userId, sql) {
    const serverCfg = await ProfileRepository.getById(profileId, 1, userId);
    if (serverCfg.length > 0) {
      // console.log(`serverCfggggggggggggggggggg>>`, serverCfg);
      const pgPool = new Pool(serverCfg[0]);
      return pgPool.query(sql);
    }
    return [];
  }


  async getExport(userId) {
    let sql = `SELECT max(seq) as seq FROM profile`;
    const res = await new Promise((resolve, reject) => {
      db.all(sql, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }
}

module.exports = new DbRepository();
