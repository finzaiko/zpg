const profileService = require("../services/profile.service");
const QueryService = require(`../services/query.service`);

class QueryController {

  duplidateFieldId(originalArray){
    let newArray = [];
    let set = new Set();
    let a =0
    for (let i = 0; i < originalArray.length; i++) {
        
      if(!set.has(originalArray[i])) {
          newArray.push(originalArray[i]);
          set.add(originalArray[i]);
        } else { 
          newArray.push(originalArray[i]+'_'+a);
        }
      a++;
    }
    return newArray;
  }

  async runSQL(request, reply) {
    let errors = [];
    if (!request.body.sql) {
      errors.push("No Conn Name specified");
    }
    let data = {
      source_id: request.body.source_id,
      sql: request.body.sql,
      dtype: request.body.dtype,
    };

    let rcb = [];
    let start_time = new Date().getTime();

    const userId = request.user.uid;
    QueryService.runSQL(data.source_id, data.sql, userId, data.dtype, function (cb) {
      rcb.push(`\n${cb.severity}: ${cb.message}\n`);
    })
      .then((r) => {
        let tableConfig;
        let tableData;
        if (typeof r.length == "undefined") {
          if(r.dType){
            tableConfig = r.dType.map((a) => {
              return {
                id: a.column_name,
                editor: "text",
                sort: "string",
                ztype: a.data_type,
                header: [
                  {
                    text: `${a.column_name}<span style='display:block;font-weight:normal;font-size:12px;color:grey;margin-top:-8px'>${a.data_type}</span>`,
                    height: 42,
                    css: "z_multiline_header",
                  },
                  {
                    content: "textFilter",
                  },
                ],
              };
            });
          }else{
            tableConfig = r.fields.map((a) => {
              return {
                id: a.name,
                header: [{ text: `${a.name}` }, { content: "textFilter" },],
                editor: "text",
              };
            });
          }

          tableData = r.rows.map((item) => {
            if (item.id == 0) item.id = "0";
            return item;
          });
        } else {
          const rr = r[r.length - 1];
          tableConfig = rr.fields.map((a) => {
            return {
              id: a.name,
              header: [{ text: `${a.name}` }, { content: "textFilter" }],
            };
          });
          tableData = rr.rows;
        }
        let rd = {
          title: "",
          config: tableConfig,
          data: tableData,
        };

        let textMsg = [];
        const et = new Date().getTime() - start_time;
        if (typeof r.rowCount != "undefined") {
          textMsg.push(`\n${r.rowCount} rows found.`);
        }

        if (typeof rcb != "undefined" && rcb.length>0) {
          textMsg.push(`\n--notice:-- ${rcb.join("\n")}`);
        }

        let aa = textMsg.join("\n");
        Object.assign(rd, {
          total_count: r.rowCount,
          message: `Query successfully in ${et} ms.${aa}`,
        });

        let hsData = {
          title: "",
          content: data.sql,
          type: 3,
          user_id: userId,
        };

        profileService.createContent(hsData, userId);

        reply.send(rd);
      })
      .catch((e) => {
        let textMsg = [];
        if (typeof rcb != "undefined" && rcb.length>0) {
          textMsg.push(`\n--notice:-- ${rcb.join("\n")}`);
        }
        let aa = textMsg.join("\n");

        const _sql = data.sql;
        const errLine = ((_sql.substring(0, e.position).match(/\n/g) || []).length + 1);
        let errDetail = "",
          errHint = "";
        if (typeof e.detail != "undefined" && typeof e.hint != "undefined") {
          errDetail = e.detail;
          errHint = e.hint;
        }
        const errStack = e.stack.split("\n")
        reply.send({
          error: `${aa}\n\n${errStack[0]}\n${errStack[1]}\n${errStack[2]} \n${errDetail} \n${errHint} \nerrline:${errLine}`,
        });
      });
  }
}

module.exports = new QueryController();
