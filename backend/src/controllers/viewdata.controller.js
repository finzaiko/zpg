const ViewdataService = require(`../services/viewdata.service`);
const { responseOk, responseValidate } = require("../utils/http.utils");

class ViewdataController {
  async getTableData(request, reply) {
    const { id, oid, start, count, filter, sort } = request.query; // t = is type level, 1 show db only;
    // console.log(`request.query /////////`, request.query);
    const userId = request.user.uid;
    const r = await ViewdataService.getTableData(
      id,
      userId,
      oid,
      count,
      start,
      filter,
      sort
    );
    const tableConfig = r.tblType.rows.map((a) => {
      return {
        id: a.column_name,
        editor: "text",
        sort: "server",
        ztype: a.data_type,
        header: [
          {
            text: `${a.column_name}<span style='display:block;font-weight:normal;font-size:12px;color:grey;margin-top:-8px'>${a.data_type}</span>`,
            height: 42,
            css: "z_multiline_header",
          },
          {
            content: "serverFilter",
          },
        ],
      };
    });
    let tableData = r.tblData.rows;
    let rd = {
      // title: "",
      tbl_oid: oid,
      config: tableConfig,
      data: tableData,
      pos: parseInt(start),
      total_count: r.total_count,
    };

    reply.send(rd);
    // responseOk(reply, { data: data.rows, pos: 0, total_count: data.rowCount });
  }

  async updateTableData(request, reply) {
    // const { id, oid, start, count, filter, sort } = request.query; // t = is type level, 1 show db only;
    // console.log(`request.params.oid`, request.params.oid);
    // console.log(`updateTableData==request.body /////////`, request.body);

    const userId = request.user.uid;
    // profileId, userId, oid, bodyData
    const r = await ViewdataService.updateTableData(userId, request.body);
    reply.send({ status: "ok" });
  }

  async saveResult2(request, reply) {
    const userId = request.user.uid;
    const r = await ViewdataService.saveResult2(userId, request.body);
    reply.send({ status: "ok" });
  }

  async saveResult(request, reply) {
    const userId = request.user.uid;
    const r = await ViewdataService.saveResult(userId, request.body);
    // console.log('r',r);
    reply.send({ status: "ok" });
  }

  async remove(request, reply) {
    await ViewdataService.removeRow(request.body);
    responseHttp(reply, 204, "Removed");
  }
}

module.exports = new ViewdataController();
