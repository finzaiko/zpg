const BaseRepository = require(`../repositories/base.repository`);

class AdministrationService {
  async reloadConf(userId, bodyData) {
    const { source_id } = bodyData;
    const sql = `SELECT pg_reload_conf() as success`;
    const sourceData = await BaseRepository.runQuery(source_id, userId, sql);
    return sourceData.rows[0];
  }
}
module.exports = new AdministrationService();
