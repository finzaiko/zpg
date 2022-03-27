const pool = require("../config/db");
const { db } = require("../core/database");
const bcrypt = require("bcrypt");

class SettingRepository {

  async getAll(userId) {
    let sql = `SELECT * FROM setting WHERE u_type>=(SELECT CASE WHEN user_level=1 THEN 0 ELSE 3 END FROM user WHERE id=${userId})`;
    let params = [];
    const res = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async getByKey(key) {
    const sql = "SELECT m_val, d_type FROM setting WHERE m_key=?";
    const params = [key];
    const res = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async getByMultiKey(keys) {
    const sql = "SELECT m_key, m_val FROM setting WHERE m_key IN (?)";
    const params = [keys];
    const res = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }


}

module.exports = new SettingRepository();
