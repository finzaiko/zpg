const pool = require("../config/db");
const { db } = require("../core/database");
const { randomString } = require("../utils/string.utils");

class ShareRepository {
  async getAll(filter, offset, limit, sort, userId) {
    let sql = `SELECT share.id, CASE WHEN title IS NULL THEN substr(content,0,38) ELSE title END AS title, content, ukey, is_read,
      CASE WHEN share_to =${userId} THEN 'arrow-bottom-left z_receive_share' ELSE 'arrow-top-right z_sent_share' END as icon, -- r=receive, s=sent
      CASE WHEN share_to !=${userId} THEN 1 ELSE 0 END is_me, COALESCE(share_status,0) as share_status,
      CASE WHEN share_to !=${userId} THEN 'to: ' || usr2.fullname || '<br>at: ' || share.created_at ELSE 'from: ' || usr1.fullname  || '<br>at: ' || share.created_at  END share_user_label,
      CASE WHEN share_to !=${userId} THEN 'to: ' || usr2.fullname || ' at: ' || share.created_at ELSE 'from: ' || usr1.fullname  || ' at: ' || share.created_at  END share_user_label_flat
      FROM share
      LEFT JOIN user usr1 ON usr1.id=share.user_id
      LEFT JOIN user usr2 ON usr2.id=share.share_to
      WHERE
         (user_id=${userId} and (share_to!=${userId} and coalesce(share_status,0) NOT IN (1,3))
           OR
           share_to=${userId} and (share_to=${userId} and coalesce(share_status,0) NOT IN (2,3))
         )
      ORDER BY share.id DESC
      `;
    // console.log("sql>>>> ", sql);
    const res = await new Promise((resolve, reject) => {
      db.all(sql, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async getByField(field, value, userId) {
    let sql = `SELECT share.id, CASE WHEN title IS NULL THEN substr(content,0,38) ELSE title END AS title, content, ukey,
      CASE WHEN share_to =${userId} THEN 'arrow-bottom-left z_receive_share' ELSE 'arrow-top-right z_sent_share' END as icon, -- r=receive, s=sent
      CASE WHEN share_to !=${userId} THEN 1 ELSE 0 END is_me, COALESCE(share_status,0) as share_status,
      usr1.fullname AS from_user,
      usr2.fullname AS to_user,
      share.created_at,
      CASE WHEN share_to !=${userId} THEN 'to: ' || usr2.fullname || ' at: ' || share.created_at ELSE 'from: ' || usr1.fullname  || ' at: ' || share.created_at  END share_user_label_flat
      FROM share
      LEFT JOIN user usr1 ON usr1.id=share.user_id
      LEFT JOIN user usr2 ON usr2.id=share.share_to
      WHERE ${field}='${value}'
      `;
    // console.log("sql>>>> ", sql);
    const res = await new Promise((resolve, reject) => {
      db.all(sql, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async create(data) {
    const ukey = randomString(8);
    const sql = `INSERT INTO share (content, ukey, user_id, share_to) VALUES (?,?,?,?)`;
    let params = [data.content, ukey, data.user_id, data.share_to];

    const res = await new Promise((resolve, reject) => {
      db.run(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async update(id, title, content) {
    let contentSql = "";
    if (content) {
      contentSql = `, content='${content}'`;
    }
    const sql = `UPDATE share SET title='${title}' ${contentSql} WHERE id=${id}`;
    const res = await new Promise((resolve, reject) => {
      db.all(sql, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async updateRead(id, isRead) {
    const sql = `UPDATE share SET is_read=${isRead} WHERE id=${id}`;
    const res = await new Promise((resolve, reject) => {
      db.all(sql, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async delete(id, status) {
    const sql = "UPDATE share SET share_status=? WHERE id=?";
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
