const async = require("async");
const pool = require("../config/db");
const { db } = require("../core/database");
const queryFilterSort = require("../utils/query.util");
const DbDbRepository = require(`./db.repository`);
const { dbAllFuncList } = require("../core/sql/db.sql");
const BaseRepository = require(`./base.repository`);

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

  async getAllFuncByTaskId(taskId) {
    const sql = `SELECT * FROM task_item WHERE type=1 AND task_id=?`;
    // console.log(`sqllllllllllllllll`, sql);
    const params = [taskId];
    const res = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }


  async getAllFuncByName(profileId, userId) {
    const serverCfg = await ProfileRepository.getById(profileId, 1, userId);
    if (serverCfg.length > 0) {
      const pgPool = new Pool(serverCfg[0]);
      return pgPool.query(dbSchemaAll);
    }
    return [];
  }

  async updateAllFuncByTaskId(profileId, userId, taskId) {
    const res = await new Promise((resolve, reject) => {
      this.getAllFuncByTaskId(taskId).then((r) => {
        // console.log('rrrrrrrrrrrrrrrrrr',r);

        db.serialize(function () {
          db.run("begin transaction");
          async.eachSeries(
            r,
            (d, next) => {
              console.log("ddddddddddddddddddddddddddddddd", d);

              const sql2 = `${dbAllFuncList()} WHERE schema='${d.schema}' ANd name='${d.name}' AND params_in='${d.params_in}' AND params_out=${d.params_out}
              AND params_inout=${d.params_inout} AND return_type='${d.return_type}'`;
              console.log('sql2',sql2);

              // db.run(sql2, function (err, row) {
              //   console.log("errrrr", err);
              //   console.log("rowwww", row);
              //   if (err) reject(err);
              // });

              BaseRepository.runQuery(profileId, userId, sql2).then(r2=>{
                console.log('rrrrrrrrrrrr>>>',r2.rows[0]);
                const rw = r2.rows[0];
                // db.run(`UPDATE task_item SET oid=${rw.id}, sql_content='test' WHERE task_id=${taskId}
                // db.run(`UPDATE task_item SET oid=${rw.id}, sql_content='${rw.sql_content}' WHERE task_id=${taskId}
                // AND schema='${rw.schema}' AND name='${rw.name}' AND params_in='${rw.params_in}' AND params_out=${rw.params_out}
                // AND params_inout=${rw.params_inout} AND return_type='${rw.return_type}'`,
                //   function (err, row) {
                //     console.log("error", err);

                //     if (err) reject(err);
                //   }
                // );
                let params = [
                  rw.id,
                  rw.sql_content,
                  taskId,
                  rw.schema,
                  rw.name,
                  rw.params_in,
                  rw.params_out,
                  rw.params_inout,
                  rw.return_type,
                ];
                db.run(`UPDATE task_item SET oid=?, sql_content=? WHERE task_id=?
                AND schema=? AND name=? AND params_in=? AND params_out=?
                AND params_inout=? AND return_type=?`, params,
                  function (err, row) {
                    console.log("error", err);

                    if (err) reject(err);
                  }
                );

              });
              next();
            },
            function () {
              resolve("done");
            }
          );
          db.run("commit");
          resolve("done");
        });
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
    console.log("data>>>>>>>>>>>>>>>inserteditemtask>>>", data);

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
    const funcData = parsedData.filter(
      (obj) => obj.task_type == 1 || obj.type == 1
    );
    console.log("/////////////////////////////////0", funcData);
    let idListFunc = [],
      oidListFunc = [];
    funcData.forEach((obj, id) => {
      idListFunc.push(obj.id);
      oidListFunc.push(obj.oid);
    });

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
      console.log("/////////////////////////////////1", idListFunc.join(","));
      console.log("/////////////////////////////////2", oidListFunc.join(","));
      db.serialize(function () {
        db.run("begin transaction");
        db.run(
          `DELETE FROM task_item WHERE task_id=${
            data.task_id
          } AND id IN (${idListFunc.join(",")})`
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
                console.log("error", err);

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

      // console.log('///////',data.source_db_id, userId, data.task_id);

      this.updateAllFuncByTaskId(data.source_db_id, userId, data.task_id).then((rr) => {
        console.log("rr>>", rr);
      });
    });
    return res;
  }

  async update(id, data) {
    const sql = `UPDATE task_item SET task_id=?, name=?, type=?, sql_content=?, oid=? WHERE id=?`;
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

  async updateByField(key, value, data) {
    const sql = `UPDATE task_item SET task_id=${data.task_id}, name='${data.func_name}', type='${data.type}', sql_content='${data.sql_content}', oid='${data.oid}' WHERE ${key}='${value}'`;
    const res = await new Promise((resolve, reject) => {
      db.all(sql, (err, row) => {
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

  async updateSequence(taskId, dataArr) {
    const res = await new Promise((resolve, reject) => {
      db.serialize(function () {
        db.run("begin transaction");
        async.eachSeries(
          dataArr,
          (d, next) => {
            const oneSql = `UPDATE task_item SET seq=${d.seq} WHERE task_id=${taskId} AND id=${d.id};`;
            db.run(oneSql, function (err, row) {
              if (err) reject(err);
            });
            next();
          },
          function () {
            resolve("done");
          }
        );
        db.run("commit");
        resolve("done");
      });
    });
    return res;
  }
}

module.exports = new TaskItemRepository();
