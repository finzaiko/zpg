const ViewdataService = require(`../services/viewdata.service`);

class ViewdataController {
  async getTableData(request, reply) {
    const { id, oid, start, count, filter, sort } = request.query; // t = is type level, 1 show db only;
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
      tbl_oid: oid,
      config: tableConfig,
      data: tableData,
      pos: parseInt(start),
      total_count: r.total_count,
    };

    reply.send(rd);
  }

  async updateTableData(request, reply) {
    const userId = request.user.uid;
    const r = await ViewdataService.updateTableData(userId, request.body);
    reply.send({ status: "ok" });
  }
}

module.exports = new ViewdataController();
