const DbService = require(`../services/db.service`);
const { responseOk, responseValidate } = require("../utils/http.utils");

class DbController {
  async getAll(request, reply) {
    const { id, t } = request.query; // t = is type level, 1 show db only;
    const userId = request.user.uid;
    const data = await DbService.getAll(id, userId, t);
    responseOk(reply, { data: data.rows, pos: 0, total_count: data.rowCount });
  }

  async getSchemaContent(request, reply) {
    const { id } = request.query;
    const userId = request.user.uid;
    const data = await DbService.getSchemaContent(id, null, null, null, null, userId);
    responseOk(reply, { data: data });
  }

  async getSchemaTree(request, reply) {
    const { id, root, parent, t } = request.query;
    const userId = request.user.uid;
    if (parent.split("_")[1] == "s") {
      const newParent = parent.split("_")[0];
      const data = [
        { id: newParent + "_t", value: "Tables", webix_kids: true },
        { id: newParent + "_f", value: "Functions", webix_kids: true },
      ];
      responseOk(reply, { parent: parent, data: data });
    } else {
      const data = await DbService.getSchemaTree(id, root, parent, userId, t);
      responseOk(reply, { parent: parent, data: data });
    }
  }

  async getSchemaContentTree(request, reply) {
    const { id, root, oid, t } = request.query;
    const userId = request.user.uid;
    const r = await DbService.getSchemaContentTree(id, root, oid, userId, t);

    let m = oid.split("_")[1];
    let _data = [];
    if (m == "g" || m == "u") {
      if(r.rows.length>0){
        _data = r.rows[0].data;
      }
    }
    responseOk(reply, { data: _data });
  }

  async getContentSearch(request, reply) {
    let errors = [];
    const { id, root, filter, type, view } = request.query;
    if (!id) {
      errors.push("Profile required");
    }
    if (!root) {
      errors.push("Root ID required");
    }
    if (errors.length) {
      responseValidate(reply, { error: errors.join(",") });
      return;
    }

    const userId = request.user.uid;
    if (filter.value) {
      const r = await DbService.getContentSearch(id, root, filter.value, userId, type, view);
      responseOk(reply, { data: r.rows });
    } else {
      responseOk(reply, []);
    }
  }
}

module.exports = new DbController();
