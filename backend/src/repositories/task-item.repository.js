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

    sql += `ORDER BY ti.id DESC`;
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
    const sql = `INSERT INTO task_item (task_id, name, type, sql_content, oid) VALUES (?,?,?,?,?)`;
    let params = [
      data.task_id,
      data.func_name,
      data.type,
      data.sql_content,
      data.oid,
    ];

    const res = await new Promise((resolve, reject) => {
      db.run(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async createSelected(data, userId) {
    const res = await new Promise((resolve, reject) => {
      DbDbRepository.getSchemaContent(
        data.source_db_id,
        null,
        null,
        null,
        data.oid_arr,
        userId
      ).then((r) => {
        db.serialize(function () {
          db.run("begin transaction");
          db.run(
            `DELETE FROM task_item WHERE task_id=${data.task_id} AND oid IN (${data.oid_arr})`
          );
          async.eachSeries(
            r,
              (d, next) => {
              db.run(
                `INSERT INTO task_item (task_id, schema, name, params_in, params_out, params_inout, return_type, type, oid) 
                    VALUES (${data.task_id},'${d.schema}','${d.name}',${d.params_in},${d.params_out},${d.params_inout},'${d.return_type}',1,${d.id})`,
                function (err, row) {
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
      });
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
