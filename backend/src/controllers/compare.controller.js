const compareArrayAll = require("../core/util");
const CompareService = require(`../services/compare.service`);
const { responseOk, responseValidate } = require("../utils/http.utils");

class CompareController {
  async getSchemaList(request, reply) {
    const { id } = request.query; // t = is type level, 1 show db only;
    const userId = request.user.uid;
    const data = await CompareService.getSchemaList(id, userId);
    responseOk(reply, { data: data.rows, pos: 0, total_count: data.rowCount });
  }

  async getCompareSchema(request, reply) {
    const { source_id, target_id, schema, is_show_table, is_target, oid } =
      request.query;

    const userId = request.user.uid;

    let errors = [];
    if (!request.query.source_id) {
      errors.push("Source ID required");
    }
    if (!request.query.target_id) {
      errors.push("Target ID required");
    }
    if (errors.length) {
      reply
        .code(code)
        .header(`Content-Type`, `application/json; charset=utf-8`)
        .send({ error: errors.join(",") });
      return;
    }

    const dataA = await CompareService.getSchemaInfo(
      source_id,
      userId,
      schema,
      is_show_table,
      // is_target,
      oid
    );

    const dataB = await CompareService.getSchemaInfo(
      target_id,
      userId,
      schema,
      is_show_table,
      // is_target,
      oid
    );
    let dataAll = compareArrayAll(dataA.rows, dataB.rows);

    const dataMerge = dataAll.sort(function (a, b) {
      return a.specific_schema - b.specific_schema || a.proname - b.proname;
    });

    const countDif = dataAll.reduce(function (n, val) {
      return n + (val.err === "dif");
    }, 0);
    const countSrc = dataAll.reduce(function (n, val) {
      return n + (val.err === "src");
    }, 0);
    const countTrg = dataAll.reduce(function (n, val) {
      return n + (val.err === "trg");
    }, 0);

    const res = {
      status: true,
      count_dif: countDif,
      count_src: countSrc,
      count_trg: countTrg,
      total_count: dataAll.length,
      data: dataMerge,
    };
    responseOk(reply, { data: res.data });
  }

  async getContentDiff(request, reply) {
    const userId = request.user.uid;

    let errors = [];
    if (!request.query.source_id) {
      errors.push("Source ID required");
    }
    if (!request.query.target_id) {
      errors.push("Target ID required");
    }
    if (!request.query.oid) {
      errors.push("OID source required");
    }
    if (errors.length) {
      reply
        .code(code)
        .header(`Content-Type`, `application/json; charset=utf-8`)
        .send({ error: errors.join(",") });
      return;
    }

    const { source_id, target_id, oid, schema, name, ret, prm_in } =
      request.query;
    const b = await CompareService.getDiffDetail(
      target_id,
      userId,
      "",
      schema,
      name,
      ret,
      prm_in
    );
    const oidTarget = b.rows[0].id;
    const c = await CompareService.getContentDiff(
      source_id,
      userId,
      "",
      "f",
      oid
    );
    const d = await CompareService.getContentDiff(
      target_id,
      userId,
      "",
      "f",
      oidTarget
    );
    const res = {
      status: true,
      data: {
        source: c.rows[0].value,
        target: d.rows[0].value,
      },
    };

    reply
      .code(200)
      .header(`Content-Type`, `application/json; charset=utf-8`)
      .send(res);
  }
}

module.exports = new CompareController();
