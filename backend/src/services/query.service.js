const QueryRepository = require(`../repositories/query.repository`);
const { pgType } = require("../utils/pg.util");

class QueryService {
  async runSQL(profileId, sql, userId, isDType, sqlType, isDropReplace, callback) {
    let q = await QueryRepository.runSQL(profileId, sql, userId, callback);
    if(isDType){
      // const tp = await QueryRepository.getQueryDataType(profileId, userId, sql);
      // q.dType = tp.pop().rows;
      q.dType = isDType;
    }
    if(q.length>1){
      return q[q.length - 1];
    }

    return q;
  }
}
module.exports = new QueryService();
