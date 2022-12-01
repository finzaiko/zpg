const profileService = require("../services/profile.service");
const QueryService = require(`../services/query.service`);
const { pgType } = require("../utils/pg.util");

class QueryController {
  duplidateFieldId(originalArray) {
    let newArray = [];
    let set = new Set();
    let a = 0;
    for (let i = 0; i < originalArray.length; i++) {
      if (!set.has(originalArray[i])) {
        newArray.push(originalArray[i]);
        set.add(originalArray[i]);
      } else {
        newArray.push(originalArray[i] + "_" + a);
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
      history: request.body.history,
    };

    let rcb = [];
    let start_time = new Date().getTime();

    const userId = request.user.uid;
    QueryService.runSQL(
      data.source_id,
      data.sql,
      userId,
      data.dtype,
      data.sqltype,
      data.dropreplace,
      function (cb) {
        // console.log(`cb>>>>>>>>>>>>`, cb);
        rcb.push(`\n${cb.severity}: ${cb.message}\n`);
        // rcb = cb;
      }
    )
      .then((r) => {
        let tableConfig;
        let tableData;
        let status = 0;
        // console.log('r>>>>>>>>>',r);
        const columnDef = r.fields.map((obj, i) => {
          return {
            colHeader: obj.name,
            colName: obj.name + "_" + i,
            colType:
              typeof pgType[obj.dataTypeID] != "undefined"
                ? pgType[obj.dataTypeID]
                : "unknown",
          };
        });

        if (typeof r.length == "undefined") {
          if (r.dType) {
            tableConfig = columnDef.map((obj) => {
              return {
                id: obj.colName,
                editor: "text",
                sort: "string",
                ztype: obj.colType,
                header: [
                  {
                    text: `${obj.colHeader}<span style='display:block;font-weight:normal;font-size:12px;color:grey;margin-top:-8px'>${obj.colType}</span>`,
                    height: 42,
                    css: "z_multiline_header",
                  },
                  {
                    content: "textFilter",
                  },
                ],
              };
            });
          } else {
            tableConfig = columnDef.map((obj) => {
              return {
                id: obj.colName,
                editor: "text",
                sort: "string",
                ztype: obj.colType,
                header: [
                  { text: `${obj.colHeader}` },
                  { content: "textFilter" },
                ],
              };
            });
          }

          tableData = r.rows.map(function (x) {
            let newObj = {};
            const objType = ["json","jsonb","json[]","jsonb[]","interval"];
            let nullVal = [];
            columnDef.forEach((obj, i) => {
              const isObjVal = objType.find(o=>o==obj.colType);
              if(typeof isObjVal!="undefined"){
                newObj[obj.colName] = JSON.stringify(x[i]);
              }else{
                newObj[obj.colName] = x[i];
              }
              if (x[i] === null){
                nullVal.push([obj.colName,'z_cell_null'])
              }
            });
            const nullObj = Object.fromEntries(nullVal);

            // return newObj;
            return Object.assign(newObj, {"$cellCss":nullObj});

            /*
            // Handle null value
            let nullObj={};
            Object.keys(newObj).forEach(function (item) {
              if (newObj[item] === null){
                nullVal.push(item)
              }
            });

            nullVal.forEach((value, index) => {
              nullObj[value] = 'z_cell_null';
            });

            return Object.assign(newObj, {"$cellCss":nullObj});
            // END: Handle null value
            */

          });

        } else {
          const rr = r[r.length - 1];
          tableConfig = columnDef.map((obj) => {
            return {
              id: obj.colName,
              editor: "text",
              header: [
                { text: `${obj.colHeader}` },
                { content: "textFilter" },
              ],
            };
          });

          // tableData = rr.rows;
          tableData = rr.map(function (x) {
            let newObj = {};
            columnDef.forEach((obj, i) => {
              if(obj.colType=='json' || obj.colType=='jsonb'){
                newObj[obj.colName] = JSON.stringify(x[i]);
              }else{
                /*
                if(x[i]===null){ //  Object.is(x[i], null)
                  newObj[obj.colName] = '[null]';
                }else{
                  newObj[obj.colName] = x[i];
                }
                */
                newObj[obj.colName] = x[i];
              }
            });
            return newObj;
          });
        }
        let rd = {
          title: "",
          config: tableConfig,
          data: tableData,
        };

        let textMsg = [];
        //  console.log(`rcb###########2`, rcb);
         if (typeof rcb != "undefined" && rcb.length > 0) {
          // textMsg.push(`\n--notice:--\n${rcb.severity} ${rcb.message}\n`);
          textMsg.push(`${rcb.join("\n")}\n--end:notice:--\n`);
        }

        const et = new Date().getTime() - start_time;

        let noticeResult = textMsg.join("\n");
        const rc = r.rowCount;
        let effected = rc ? `\n${rc} rows effected.` : '';
        Object.assign(rd, {
          total_count: rc,
          message: `${noticeResult}\nQuery successfully in ${et} ms.${effected}\n`,
        });

        if(!data.history){ // is disable history
          const hsData = {
            title: "",
            content: data.sql,
            type: 3,
            user_id: userId,
          };
          profileService.createContent(hsData, userId);
        }

        let seen = new Set();
        const hasDuplicates = r.fields.some(function (currentObject) {
          return seen.size === seen.add(currentObject.name).size;
        });

        if (hasDuplicates) {
          Object.assign(rd, {
            err_status: 1,
            err_msg: `Warning: SQL result field contains duplicate field names, potential inaccurate result, please replace it make an alias.`,
          });
        }
        reply.send(rd);
      })
      .catch((e) => {
        let textMsg = [];
        if (typeof rcb != "undefined" && rcb.length > 0) {
          // textMsg.push(`\n--notice:--\n${rcb.severity} ${rcb.message}\n`);
          textMsg.push(`\n--notice:-- ${rcb.join("\n")}`);
        }
        let zErrorMsg = textMsg.join("\n");

        // console.log(`eeeeeeeeeeeeee`, e);
        const _sql = data.sql;
        const errLine =
          (_sql.substring(0, e.position).match(/\n/g) || []).length + 1;
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
        const errStack = e.stack.split("\n");
        reply.send({
          // error: `${aa}\n\n${errStack[0]}\n${errStack[1]}\n${errStack[2]} \n${errDetail} \n${errHint} \nerrline:${errLine}`,
          error: `${zErrorMsg}\n${errStack[0]}\nerrline: ${errLine}${
            errDetail ? "\n" + errDetail : ""
          } \n\nhint: ${errHint}`,
        });
      });
  }

  async getTableName(request, reply) {
    const { id, oid, start, count, filter, sort } = request.query; // t = is type level, 1 show db only;
    // console.log(`request.query /////////`, request.query);
    const userId = request.user.uid;
    const r = await QueryService.getTableNameByOid(
      id,
      userId,
      oid
    );
    reply.send(r.rows[0]);
  }
}

module.exports = new QueryController();
