const async = require("async");
const pool = require("../config/db");
const { db } = require("../core/database");
const queryFilterSort = require("../utils/query.util");
const DbDbRepository = require(`./db.repository`);

class TaskItemRepository {
  async getAll(filter, offset, limit, sort, userId) {
    let sql = `SELECT ti.* FROM task_item ti JOIN task t ON t.id=ti.task_id WHERE t.user_id=?`;

    if (filter) {
      sql += queryFilterSort(filter, true);
    }

    sql += `ORDER BY ti.seq`;
    // console.log(`sqllllllllllllllllll`, sql);
    let params = [userId];
    const res = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async getById(id, userId) {
    const sql = "SELECT * FROM task_item WHERE id=? AND user_id=?";
    const params = [id, userId];
    const res = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async getAllByField(fieldName, fieldValue) {
    const sql = `SELECT * FROM task_item WHERE ${fieldName}=?`;
    // console.log(`sqllllllllllllllll`, sql);
    const params = [fieldValue];
    const res = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async create(data) {

    // tasItemDto.task_id = data.task_id;
    // tasItemDto.schema = data.schema;
    // tasItemDto.func_name = data.func_name;
    // tasItemDto.type = data.type;
    // tasItemDto.sql_content = data.sql_content;
    // tasItemDto.oid = data.oid;

    const sql = `INSERT INTO task_item (task_id, schema, name, type, sql_content, oid, seq) VALUES (?,?,?,?,?,?,?)`;
    let params = [
      data.task_id,
      data.schema,
      data.func_name,
      data.type,
      data.sql_content,
      data.oid,
      data.seq,
    ];

    const res = await new Promise((resolve, reject) => {
      db.run(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async changeStatus(data) {
    const sql = `UPDATE task_item SET ${data.field_name}=${data.field_value} WHERE id=${data.id}`;
    const res = await new Promise((resolve, reject) => {
      db.run(sql, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async createSelected(data, userId) {
    console.log('data>>>>>>>>>>>>>>>inserteditemtask>>>',data);

    const parsedData = JSON.parse(data.oid_arr);
    // const arrId = parsedData.map((v) => v.id).join(",");
    // console.log('arrId',arrId);

    // let idList = [], oidList = [];
    // parsedData.forEach((obj,id)=>{
    //   idList.push(obj.id);
    //   oidList.push(obj.oid);
    // })
    // const idListString = idList.join(",");
    // const oidListString = oidList.join(",");

    // console.log('idList',idList);
    // console.log('oidList',oidList);

    // FUNC TYPE -------------------------
    const funcData = parsedData.filter(obj=>obj.task_type==1 || obj.type==1);
    console.log("/////////////////////////////////0", funcData);
    let idListFunc = [], oidListFunc = [];
    funcData.forEach((obj,id)=>{
      idListFunc.push(obj.id);
      oidListFunc.push(obj.oid);
    })

    // const idListString = idListFunc.join(",");
    // const oidListString = oidListFunc.join(",");

    const res = await new Promise((resolve, reject) => {
      // DbDbRepository.getSchemaContent(
      //   data.source_db_id,
      //   null,
      //   null,
      //   null,
      //   // data.oid_arr,
      //   oidListFunc.join(","),
      //   userId
      // ).then((r) => {
        console.log("/////////////////////////////////1",idListFunc.join(","));
        console.log("/////////////////////////////////2",oidListFunc.join(","));
        db.serialize(function () {
          db.run("begin transaction");
          db.run(
            `DELETE FROM task_item WHERE task_id=${data.task_id} AND id IN (${idListFunc.join(",")})`
          );
          async.eachSeries(
            funcData,
              (d, next) => {
                // idx++;d
                console.log("/////////////////////////////////3", d);
                console.log("/////////////////////////////////4", d.name);
              db.run(
                `INSERT INTO task_item (task_id, schema, name, params_in, params_out, params_inout, return_type, type, oid, seq, is_execreplace, is_active)
                    VALUES (${data.task_id},'${d.schema}','${d.name}',${d.params_in},${d.params_out},${d.params_inout},'${d.return_type}',1,${d.oid},${d.seq},0,1)`,
                function (err, row) {
                  console.log('error',err);

                  if (err) reject(err);
                }
                );
                next();
            },
            function () {
              resolve("done");
            }
          );
          db.run("commit");
          resolve("done");
        });
      // });
    });
    return res;
  }

  async update(id, data) {
    const sql = `UPDATE task_item SET task_id=?, name=?, type=?, sql_content=?, oid=?WHERE id=?`;
    let params = [
      data.task_id,
      data.func_name,
      data.type,
      data.sql_content,
      data.oid,
      id,
    ];

    const res = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async delete(id) {
    const sql = "DELETE FROM task_item WHERE id=?";
    let params = [id];
    const res = await new Promise((resolve, reject) => {
      db.run(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async deleteSelected(data) {
    const selId = data.sid;
    const sql = `DELETE FROM task_item WHERE id IN (${selId})`;
    const res = await new Promise((resolve, reject) => {
      db.run(sql, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async deleteByOid(id) {
    const sql = `DELETE FROM task_item WHERE id=? AND oid=?`;
    let params = [taskId, oidArr];
    const res = await new Promise((resolve, reject) => {
      db.run(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }
}

module.exports = new TaskItemRepository();
