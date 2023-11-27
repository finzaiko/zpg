const pool = require("../config/db");
const { db } = require("../core/database");

class TaskRepository {
  async getAll(offset, limit, sort, userId) {
    let sql = `SELECT * FROM task_user WHERE user_id=? ORDER BY id DESC`;
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
    const sql = "SELECT * FROM task_user WHERE id=? AND user_id=?";
    const params = [id, userId];
    const res = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async getUserAccessListByUserId(userId, limit=10) {
    const sql = `SELECT DISTINCT t.id, t.task_name as value FROM task_user tu
      JOIN task t ON t.id=tu.task_id
      WHERE tu.user_id=? OR t.user_id=? ORDER BY t.id DESC LIMIT ?`;
    const params = [userId,userId,limit];
    const res = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async getByField(fieldName, fieldValue) {
    const sql = `SELECT tu.*, u.fullname FROM task_user tu JOIN user u ON u.id=tu.user_id WHERE tu.${fieldName}=?`;
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
    const sql = `INSERT INTO task_user (task_id, user_id) VALUES (?,?)`;
    let params = [
      data.task_id,
      data.user_id,
    ];
    const res = await new Promise((resolve, reject) => {
      db.run(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async delete(id) {
    const sql = "DELETE FROM task_user WHERE id=?";
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
