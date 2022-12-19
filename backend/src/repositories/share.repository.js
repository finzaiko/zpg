const pool = require("../config/db");
const { db } = require("../core/database");

class ShareRepository {
  async getAll(filter, offset, limit, sort, userId) {
    let sql = `SELECT * FROM profile WHERE type=6 AND createdby=${userId} AND share_to=${filter} ORDER BY id DESC`;
    let params = [userId];
    const res = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async create(data) {
    const sql = `INSERT INTO profile (content, type, user_id, share_to) VALUES (?,?,?,?)`;
    let params = [
      data.content,
      data.type,
      data.user_id,
      data.share_to,
    ];

    const res = await new Promise((resolve, reject) => {
      db.run(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

}

module.exports = new ShareRepository();
