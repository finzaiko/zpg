const pool = require("../config/db");
const { db } = require("../core/database");

class SnippetRepository {
  async getAll(offset, limit, sort, userId) {
    let sql = `SELECT * FROM snippet WHERE user_id=? OR user_id=0 ORDER BY label`;
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
    const sql = "SELECT * FROM snippet WHERE id=? AND user_id=?";
    const params = [id, userId];
    const res = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async getSearch(searchValue, userId) {
    const sql = `SELECT * FROM snippet WHERE LOWER(label) LIKE '%${searchValue}%' AND (user_id=0 OR user_id=${userId})`;
    const res = await new Promise((resolve, reject) => {
      db.all(sql, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }
}

module.exports = new SnippetRepository();
