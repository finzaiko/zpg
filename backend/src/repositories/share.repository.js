const pool = require("../config/db");
const { db } = require("../core/database");

class ShareRepository {
  async getAll(filter, offset, limit, sort, userId) {
    let sql = `SELECT id, CASE WHEN title IS NULL THEN substr(content,0,38) ELSE title END AS title, content,
      CASE WHEN share_to =${userId} THEN 'arrow-bottom-left z_receive_share' ELSE 'arrow-top-right z_sent_share' END as icon, -- r=receive, s=sent
      CASE WHEN share_to !=${userId} THEN 1 ELSE 0 END is_me, COALESCE(share_status,0) as share_status, created_at
      FROM profile
      WHERE type=6 AND
         (user_id=${userId} and (share_to!=${userId} and coalesce(share_status,0) NOT IN (1,3))
           OR
           share_to=${userId} and (share_to=${userId} and coalesce(share_status,0) NOT IN (2,3))
         )
      ORDER BY id DESC
      `;
    // console.log('sql>>>> ',sql);
    const res = await new Promise((resolve, reject) => {
      db.all(sql, (err, row) => {
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

  async delete(id, status) {
    const sql = "UPDATE profile SET share_status=? WHERE id=?";
    let params = [status, id];
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
