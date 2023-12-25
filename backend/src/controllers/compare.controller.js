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

    // Save to temp table
    let datax = await CompareService.createTempTable(dataA.rows, dataB.rows);

    // console.log("datax", datax);

    // let dataAll = compareArrayAll(dataA.rows, dataB.rows);

    // const dataMerge = dataAll.sort(function (a, b) {
    //   return a.specific_schema - b.specific_schema || a.proname - b.proname;
    // });

    // const countDif = dataAll.reduce(function (n, val) {
    //   return n + (val.err === "dif");
    // }, 0);
    // const countSrc = dataAll.reduce(function (n, val) {
    //   return n + (val.err === "src");
    // }, 0);
    // const countTrg = dataAll.reduce(function (n, val) {
    //   return n + (val.err === "trg");
    // }, 0);

    // const res = {
    //   status: true,
    //   count_dif: countDif,
    //   count_src: countSrc,
    //   count_trg: countTrg,
    //   total_count: dataAll.length,
    //   data: dataMerge,
    // };

    let dataAll = await CompareService.getDiff();
    // console.log("dataAll", dataAll);
    responseOk(reply, { data: dataAll });
    // responseOk(reply, { data: "ok"});
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
    if (!request.query.source_oid || !request.query.target_oid) {
      errors.push("OID source or target are required");
    }
    if (errors.length) {
      reply
        .code(500)
        .header(`Content-Type`, `application/json; charset=utf-8`)
        .send({ error: errors.join(",") });
      return;
    }

    const {
      source_id,
      target_id,
      source_oid,
      target_oid,
      z_type,
      schema,
      name,
      ret,
      prm_in,
      prm_out,
    } = request.query;

    let contentSource = "",
      contentTarget = "";
    const c = await CompareService.getContentDiff(
      source_id,
      userId,
      `${schema}.${name}`,
      // "f",
      z_type,
      source_oid == "null" || source_oid === null ? -1 : source_oid
    );
    const d = await CompareService.getContentDiff(
      target_id,
      userId,
      `${schema}.${name}`,
      // "f",
      z_type,
      target_oid == "null" || target_oid === null ? -1 : target_oid
    );

    const res = {
      status: true,
      data: {
        // source: c.rows[0].value,
        // target: d.rows[0].value,
        source: c.content_def.value,
        source_dropdef:
          typeof c.drop_def != "undefined" ? c.drop_def.value : "",
        target: d.content_def.value,
        target_dropdef:
          typeof d.drop_def != "undefined" ? d.drop_def.value : "",
      },
    };

    reply
      .code(200)
      .header(`Content-Type`, `application/json; charset=utf-8`)
      .send(res);
  }

  async generateDiff(request, reply) {
    const { source_id, target_id, schema, filter, is_target, oid } =
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
      filter,
      // is_target,
      oid
    );

    const dataB = await CompareService.getSchemaInfo(
      target_id,
      userId,
      schema,
      filter,
      // is_target,
      oid
    );

    const arr1 = dataA.rows;
    const arr2 = dataB.rows;

    let aaFilter1 = [];
    arr1.forEach((element) => {
      let bb = arr2.find((a) => a.compare_name == element.compare_name);
      if (typeof bb == "undefined") {
        const cc = Object.assign(
          element,
          { diff: true },
          { err: "trg" },
          { src_id: element.id },
          { trg_id: null }
        );
        aaFilter1.push(cc);
      } else {
        let mm = arr2.find((a) => a.compare_name == element.compare_name);
        if (mm.z_content != element.z_content) {
          const cc = Object.assign(
            element,
            { diff: true },
            { err: "dif" },
            { src_id: element.id },
            { trg_id: bb.id }
          );
          aaFilter1.push(cc);
        } else {
          const cc2 = Object.assign(
            element,
            { src_id: element.id },
            { trg_id: bb.id }
          );
          aaFilter1.push(cc2);
        }
      }
    });

    let aaFilter2 = [];
    arr2.forEach((element) => {
      let bb = arr1.find((a) => a.compare_name == element.compare_name);
      if (typeof bb == "undefined") {
        const cc = Object.assign(
          element,
          { diff: true },
          { err: "src" },
          { trg_id: element.id },
          { src_id: null }
        );
        aaFilter2.push(cc);
      } else {
        let mm = arr1.find((a) => a.compare_name == element.compare_name);
        if (mm.z_content != element.z_content) {
          const cc = Object.assign(
            element,
            { diff: true },
            { err: "dif" },
            { trg_id: element.id },
            { src_id: bb.id }
          );
          aaFilter2.push(cc);
        } else {
          const cc2 = Object.assign(
            element,
            { trg_id: element.id },
            { src_id: bb.id }
          );
          aaFilter2.push(cc2);
        }
      }
    });

    const finalArr = aaFilter1.concat(aaFilter2);

    let mergedif = new Map();
    for (const o of finalArr) {
      mergedif.set(o.compare_name, o);
    }
    let data = [...mergedif.values()];
    responseOk(reply, { data });
  }

  async generateDiffTempTable(request, reply) {
    const { source_id, target_id, schema, filter, is_target, oid } =
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
      filter,
      // is_target,
      oid
    );

    const dataB = await CompareService.getSchemaInfo(
      target_id,
      userId,
      schema,
      filter,
      // is_target,
      oid
    );

    // Save to temp table
    let data = await CompareService.createTempTable(dataA.rows, dataB.rows);

    responseOk(reply, { data });
  }

  async getResultDiff(request, reply) {
    const data = await CompareService.getDiff();

    responseOk(reply, { data });
  }

  async generateTableRowDiff(request, reply) {
    const { source_id, target_id, schema, schema_exclude } = request.query;

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

    const dataA = await CompareService.getContentRowCount(
      source_id,
      userId,
      schema,
      schema_exclude
    );

    const dataB = await CompareService.getContentRowCount(
      target_id,
      userId,
      schema,
      schema_exclude
    );

    let data = await CompareService.createTempTable(dataA.rows, dataB.rows);

    responseOk(reply, { data });
  }
}

module.exports = new CompareController();
