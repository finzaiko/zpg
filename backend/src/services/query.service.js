const QueryRepository = require(`../repositories/query.repository`);

class QueryService {
  async runSQL(profileId, sql, userId, isDType, callback) {
    let q = await QueryRepository.runSQL(profileId, sql, userId, callback);
    if(isDType){
      const tp = await QueryRepository.getQueryDataType(profileId, userId, sql);
      q.dType = tp.pop().rows;
    }
    return q;
  }
}
module.exports = new QueryService();
