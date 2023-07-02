const BaseRepository = require(`../repositories/base.repository`);

class AdministrationService {
  async reloadConf(userId, bodyData) {
    const { source_id } = bodyData;
    const sql = `SELECT pg_reload_conf() as success`;
    const sourceData = await BaseRepository.runQuery(source_id, userId, sql);
    return sourceData.rows[0];
  }

  async runAction(userId, bodyData) {
    const { source_id, action } = bodyData;
    let sql = "";
    switch (action) {
      case 'dbsize':
        sql = `
        SELECT d.datname AS Name,  pg_catalog.pg_get_userbyid(d.datdba) AS Owner,
            CASE WHEN pg_catalog.has_database_privilege(d.datname, 'CONNECT')
                THEN pg_catalog.pg_size_pretty(pg_catalog.pg_database_size(d.datname))
                ELSE 'No Access'
            END AS Size
        FROM pg_catalog.pg_database d
        WHERE d.datname NOT IN ('template0','template1','postgres')
            ORDER BY
            CASE WHEN pg_catalog.has_database_privilege(d.datname, 'CONNECT')
                THEN pg_catalog.pg_database_size(d.datname)
                ELSE NULL
            END DESC -- nulls first
            -- LIMIT 20
        `;
        break;

      default:
        break;
    }

    const sourceData = await BaseRepository.runQuery(source_id, userId, sql);
    return sourceData.rows;
  }

  async view(userId, bodyData) {
    const { source_id, action } = bodyData;
    let sql = "";
    switch (action) {
      case 'dbsize':
        sql = `
        SELECT d.datname AS Name,  pg_catalog.pg_get_userbyid(d.datdba) AS Owner,
            CASE WHEN pg_catalog.has_database_privilege(d.datname, 'CONNECT')
                THEN pg_catalog.pg_size_pretty(pg_catalog.pg_database_size(d.datname))
                ELSE 'No Access'
            END AS Size
        FROM pg_catalog.pg_database d
        WHERE d.datname NOT IN ('template0','template1','postgres')
            ORDER BY
            CASE WHEN pg_catalog.has_database_privilege(d.datname, 'CONNECT')
                THEN pg_catalog.pg_database_size(d.datname)
                ELSE NULL
            END DESC -- nulls first
            -- LIMIT 20
        `;
        break;
      case 'version':
        sql = `SELECT version()`;
        break;
      case 'pghbaconf':
        sql = `select * from pg_hba_file_rules;`;
        break;
      case 'runqueries':
        sql = `
          SELECT pid, age(clock_timestamp(), query_start), usename, query, state
          FROM pg_stat_activity
          WHERE state != 'idle' AND query NOT ILIKE '%pg_stat_activity%'
          ORDER BY query_start desc;
        `;
        break;
      case 'connopen':
        sql = `
          SELECT COUNT(*) as connections, backend_type
          FROM pg_stat_activity
          where state = 'active' OR state = 'idle'
          GROUP BY backend_type
          ORDER BY connections DESC;
        `;
        break;
      default:
        break;
    }
    // console.log("sql>>>>>>>>>>>>>>>",sql);
    const sourceData = await BaseRepository.runQuery(source_id, userId, sql);
    return sourceData.rows;
  }
}
module.exports = new AdministrationService();
