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
}
module.exports = new AdministrationService();
