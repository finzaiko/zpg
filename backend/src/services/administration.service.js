const {
  activeSession,
  dbHitTransaction,
  pgConfigSetting,
  pgFileSetting,
  tempFileSize,
  tableSize,
  schemaSize,
  dbSize,
  runQueries,
  connOpen,
} = require("../core/sql/admin.sql");
const { dbSchemaAll } = require("../core/sql/db.sql");
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
      case "dbsize":
        sql = dbSize();
        break;

      default:
        break;
    }

    const sourceData = await BaseRepository.runQuery(source_id, userId, sql);
    return sourceData.rows;
  }

  async view(userId, bodyData) {
    const { source_id, action, db_name, schema_name } = bodyData;
    let sql = "";
    switch (action) {
      case "dbsize":
        sql = dbSize();
        break;
      case "version":
        sql = `SELECT version()`;
        break;
      case "pghbaconf":
        sql = `select * from pg_hba_file_rules;`;
        break;
      case "runqueries":
        sql = runQueries();
        break;
      case "connopen":
        sql = connOpen();
        break;
      case "activesession":
        sql = activeSession();
        break;
      case "transactionhit":
        sql = dbHitTransaction();
        break;
      case "configsetting":
        sql = pgConfigSetting();
        break;
      case "filesetting":
        sql = pgFileSetting();
        break;
      case "tempfilesize":
        sql = tempFileSize();
        break;
      case "schemasize":
        sql = schemaSize();
        break;
      case "tblsize":
        sql = tableSize(schema_name);
        break;
      default:
        break;
    }

    const sourceData = await BaseRepository.runQuery(
      source_id,
      userId,
      sql,
      db_name
    );
    return sourceData.rows;
  }
}
module.exports = new AdministrationService();
