const GeneratorService = require(`../services/generator.service`);
const { responseOk, responseValidate } = require("../utils/http.utils");

class GeneratorController {
  async getOutParams(request, reply) {
    const { id, querysql, type, dtype } = request.body;
    const userId = request.user.uid;
    const data = await GeneratorService.getOutParams(id, userId, querysql, type, dtype);
    responseOk(reply, { data: data });
  }

  async getInsertQuery(request, reply) {
    const { id, querysql, table } = request.body;
    let tblName = "<schema.table>";
    if(table.trim()!=""){
      tblName = table;
    }
    const userId = request.user.uid;
    const data = await GeneratorService.getInsertQuery(id, userId, querysql, tblName);
    responseOk(reply, { data: data });
  }
}

module.exports = new GeneratorController();


// NOTE: READ FOR INSERT QUERY GENERATOR
/*
https://github.com/brianc/node-postgres/issues/957#issuecomment-295583050
https://github.com/brianc/node-postgres/issues/957#issuecomment-200000070
https://github.com/brianc/node-postgres/issues/880
https://medium.com/swlh/nodejs-postgresql-bulk-upsert-2dbd9fe0dba
https://stackoverflow.com/questions/24008668/bulk-insert-into-postgres-with-brianc-node-postgres


*/