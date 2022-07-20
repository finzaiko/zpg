const pool = require("../config/db");
const { db } = require("../core/database");

class TaskRepository {
  async getAll(offset, limit, sort, userId) {
    let sql = `SELECT * FROM task WHERE user_id=? ORDER BY id DESC`;
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
    const sql = "SELECT * FROM task WHERE id=? AND user_id=?";
    const params = [id, userId];
    const res = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async getByField(fieldName, fieldValue, userId) {
    const sql = `SELECT * FROM task WHERE ${fieldName}=? AND user_id=?`;
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
    const sql = `INSERT INTO task (task_name, source_db_id, target_db_id, note, user_id) VALUES (?,?,NULLIF(?,''),NULLIF(?,''),?)`;
    let params = [
      data.task_name,
      data.source_db_id,
      data.target_db_id,
      data.note,
      data.user_id,
    ];
    const res = await new Promise((resolve, reject) => {
      // db.run(sql, params, (err, row) => {
      //   if (err) reject(err);
      //   resolve(row);
      // });
      db.serialize(() => {
        var stmt = db.prepare(sql);
        stmt.run(params, function (err,row) {  
          if (err) reject(err);
          resolve({last_id: this.lastID});
        });
      });
    });
    return res;
  }

  async update(id, data) {
    const sql = `UPDATE task SET task_name=?, source_db_id=?, target_db_id=NULLIF(?,''), note=NULLIF(?,'') WHERE id=?`;
    let params = [data.task_name, data.source_db_id, data.target_db_id, data.note, id];

    const res = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async delete(id) {
    const sql = "DELETE FROM task WHERE id=?";
    let params = [id];
    const res = await new Promise((resolve, reject) => {
      db.run(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }
}

module.exports = new TaskRepository();
