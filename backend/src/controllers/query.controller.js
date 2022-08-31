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

  // async runSQL(request, reply) {
 runSQL(request, reply) {
    let errors = [];
    if (!request.body.sql) {
      errors.push("No Conn Name specified");
    }
    let data = {
      source_id: request.body.source_id,
      sql: request.body.sql,
      dtype: request.body.dtype,
      sqltype: request.body.sqltype,
      dropreplace: request.body.dropreplace,
    };

    let rcb = [];
    let start_time = new Date().getTime();

    const userId = request.user.uid;
    QueryService.runSQL(data.source_id, data.sql, userId, data.dtype, data.sqltype, data.dropreplace, function (cb) {
      // console.log(`rcb###########`, cb.severity);
      rcb.push(`\n${cb.severity}: ${cb.message}\n`);
      // rcb = cb;
    })
      .then((r) => {
        let tableConfig;
        let tableData;
        // console.log('r',r);
        
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
            // console.log('r.fields>>>>>> ',r.fields);
            
            tableConfig = r.fields.map((a) => {
              // a.name = a.name +"_1";
              // console.log('a.name',a.name);
              return {
                id: a.name,
                header: [{ text: `${a.name}` }, { content: "textFilter" },],
                editor: "text",
              };
            });
          }

          // tableData = r.rows;
          tableData = r.rows.map((item) => {
            // handle webix not accept 0 value
            if (item.id == 0) item.id = "0";
            // console.log('item',item);
            
            return item;
          });
        } else {
          const rr = r[r.length - 1];
          // console.log(`mmmm`, rr);
          tableConfig = rr.fields.map((a) => {
            // return { id:a.name, header: [{text: `${a.name}<br><span style='font-weight:normal;font-size:12px'>${a.format}</span>`, height: 50, css: "z_multiline_header" }, { content:"textFilter" }]};
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
        // console.log('r.rowCount',r.rowCount);
        
        if (r.rowCount) {
          textMsg.push(`\n${r.rowCount} rows found.`);
        }

        // console.log(`rcb###########2`, rcb);
        if (typeof rcb != "undefined" && rcb.length>0) {
          // textMsg.push(`\n--notice:--\n${rcb.severity} ${rcb.message}\n`);
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
          // textMsg.push(`\n--notice:--\n${rcb.severity} ${rcb.message}\n`);
          textMsg.push(`\n--notice:-- ${rcb.join("\n")}`);
        }
        let zErrorMsg = textMsg.join("\n");

        // console.log(`eeeeeeeeeeeeee`, e);
        const _sql = data.sql;
        const errLine = ((_sql.substring(0, e.position).match(/\n/g) || []).length + 1);
        // console.log('>>>>>>>>>>line: %s', errLine);
        let errDetail = "",
          errHint = "";
        // if (typeof e.detail != "undefined" && typeof e.hint != "undefined") {
        //   errDetail = e.detail;
        //   errHint = e.hint;
        // }

        if (typeof e.detail != "undefined") {
          errDetail = e.detail;
        }
        if (typeof e.hint != "undefined") {
          errHint = e.hint;
        }
        const errStack = e.stack.split("\n")
        reply.send({
          // error: `${aa}\n\n${errStack[0]}\n${errStack[1]}\n${errStack[2]} \n${errDetail} \n${errHint} \nerrline:${errLine}`,
          error: `${zErrorMsg}\n${errStack[0]}\nerrline: ${errLine}${errDetail? "\n"+errDetail: ""} \n\nhint: ${errHint}`,
        });
      });
  }
}

module.exports = new QueryController();
