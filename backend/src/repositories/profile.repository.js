const { db } = require("../core/database");
const { Pool } = require("pg");

class ProfileRepository {
  async findAll(type, userId, isList, showAll, limit, offset, search) {
    // console.log(`type, userId, isList////////`, type, userId, isList);
    let fields = "*", andWhere = "";
    if (type == 1 || type == 2) {
      fields = `profile.id, conn_name, host, port, database, user, profile.password, ssl, content`;
    }
    if (type == 3 || type == 4 || type == 5) {
      // fields = `id, title, content, created_at`;
      fields = `profile.id, CASE WHEN title IS NULL THEN substr(content,0,38) ELSE title END AS title, content, profile.created_at`;
    }

    if(showAll==0){
      andWhere = `AND user_id=?`;
    }
    let sql = `SELECT ${fields}, user.fullname FROM profile JOIN user ON user.id=profile.user_id WHERE type=? ${andWhere}`;
    if (isList) {
      sql =
        "SELECT profile.id, substr(conn_name,0,30) as value, conn_name, host, database, ssl, content FROM profile WHERE type=? AND user_id=?";
    }

    if(search){
      sql += ` AND content LIKE '%${search}%'`;
    }
    sql += " ORDER BY profile.id DESC";

    if(limit){
      sql += " LIMIT "+ limit;
    }
    if(offset){
      sql += " OFFSET "+ offset;
    }

    // console.log('sql>>>>',sql);
    // console.log('type, userId',type, userId);

    let params = [type, userId];
    if(showAll!=0){
      params.pop();
    }
    const res = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async countAll(type, userId, isList, showAll, limit, offset, search) {
    let andWhere = "";

    if(showAll==0){
      andWhere = `AND user_id=?`;
    }
    let sql = `SELECT count(*) as total_count FROM profile JOIN user ON user.id=profile.user_id WHERE type=? ${andWhere}`;
    if (isList) {
      sql =
        "SELECT count(*) as total_count FROM profile WHERE type=? AND user_id=?";
    }

    if(search){
      sql += ` AND content LIKE '%${search}%'`;
    }

    // console.log('sql-count>>>>',sql);

    let params = [type, userId];
    if(showAll!=0){
      params.pop();
    }
    const res = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async createConn(data) {
    // 1=serverconn, 2=dbconn
    const sql =
      "INSERT INTO profile (conn_name, host, port, database, user, password, type, ssl, user_id, content) VALUES (?,?,?,?,?,?,?,?,?,?)";

    // console.log(`data`, data);
    const dbName = data.type == 1 ? "postgres" : data.database;
    const params = [
      data.conn_name,
      data.host,
      data.port,
      dbName,
      data.user,
      data.password,
      data.type,
      data.ssl,
      data.user_id,
      data.content,
    ];

    const res = await new Promise((resolve, reject) => {
      db.run(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async updateConn(id, data) {
    let passField = "";
    if (data.password != "") {
      passField = ", password=?";
    }
    const sql = `UPDATE profile SET conn_name=?, host=?, port=?, database=?, user=?${passField}, type=?, ssl=?, user_id=?, content=? WHERE id=?`;
    let params = [
      data.conn_name,
      data.host,
      data.port,
      data.database,
      data.user,
      data.password,
      data.type,
      data.ssl,
      data.user_id,
      data.content,
      id,
    ];
    if (data.password == "") {
      const i = 5; // password
      params = params.slice(0, i).concat(params.slice(i + 1, params.length));
    }
    // const _params = (arr, x) => params.filter(n => n!==x);
    // console.log(`sql########`, sql);
    // console.log(`params#####`, params);
    const res = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async deleteConn(id) {
    const sql = "DELETE FROM profile WHERE id=?";
    let params = [id];
    const res = await new Promise((resolve, reject) => {
      db.run(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async getById(id, type, userId) {
    let sql = "SELECT * FROM profile WHERE id=? AND user_id=?";
    const timeOut = 120 * 1000;
    if (type == 1 || type == 2) {
      sql = `SELECT host, database, user, password, port, IFNULL(ssl,0) AS ssl, 'ZGP-Finzaiko' AS application_name, ${timeOut} AS statement_timeout FROM profile WHERE id=? AND user_id=?`;
      // Other configuration set later
      /*
          max: configSql.get('connectionlimit'),
          min: 0,
          ssl: false,
          idleTimeoutMillis: 30000
      */
    }
    if (type == 3 || type == 4) {
      sql = `SELECT title, content, type, user_id FROM profile WHERE id=? AND user_id=?`;
    }

    let params = [id, userId];
    const res = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    if(res.length>0){
      if(res[0].ssl==1){
        res[0].ssl = {rejectUnauthorized: false};
      }
    }
    return res;
  }

  async check(data) {
    // const sql = "SELECT * FROM profile WHERE id=? AND type=?";

    const sql = `SELECT COUNT(*) AS data FROM profile
    WHERE user_id=?
    AND type=?
    AND host=?
    AND port=?
    AND database=?
    AND user=?
    `;
    const params = [
      data.user_id,
      data.type,
      data.host,
      data.port,
      data.database,
      data.user,
    ];

    // if(count<=0){
    //   const newData = {

    //   }
    //   this.createConn();
    // }

    const res = await new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async testConn(data) {
    if (data.type == 1) {
      data.database = "postgres";
    }
    const _data = {
      host: data.host,
      port: data.port,
      database: data.database,
      user: data.user,
      password: data.password,
    };

    if(data.ssl==1){
      _data.ssl = {rejectUnauthorized: false}
    }
    const pgPool = new Pool(_data);
    return pgPool.query("SELECT true");
  }

  async createContent(data) {
    const sql =
      "INSERT INTO profile (title, content, type, user_id) VALUES (NULLIF(?,''),?,?,?)";
    const params = [data.title, data.content, data.type, data.user_id];
    const res = await new Promise((resolve, reject) => {
      db.run(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async updateContent(id, data) {
    const sql = `UPDATE profile SET title=?, content=?, type=?, user_id=? WHERE id=?`;
    let params = [data.title, data.content, data.type, data.user_id, id];
    const res = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async deleteContent(id) {
    const sql = "DELETE FROM profile WHERE id=?";
    let params = [id];
    const res = await new Promise((resolve, reject) => {
      db.run(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async getUserProfile(userId) {
    let sql = `select title as key, content as value from profile where type in (5) and user_id=?`;
    let params = [userId];
    const res = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, row) => {
        if (err) reject(err);
        setTimeout(() => {
          this.getClearUserProfile();
          this.setLastLogin(userId);
        }, 1000);
        resolve(row);
      });
    });
    return res;
  }

  async saveUserProfileSetting(userId, key, value) {
    console.log("saveUserProfileSetting////////////");
    const sql = "select count(*) as data from profile where user_id=? and title=? and type=?";
    let params = [userId, key,5];

    const res = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, row) => {
        if (err) reject(err);
        const isRowExist = row[0].data>0;
        console.log('row',row);
        console.log('isRowExist',isRowExist);

        let sqlSave = ""
        if(!isRowExist){
          sqlSave = "insert into profile (content, user_id, title, type) values (?,?,?,?)";
        }else{
          console.log("update>>>>>>>>>>>>>>>>");
          sqlSave = "update profile set content=? WHERE user_id=? and title=? and type=?";
        }
        let paramsSave = [value, userId, key, 5];
        db.all(sqlSave, paramsSave, (errSave, rowSave) => {
          if (errSave) reject(errSave);
          resolve(rowSave);
        });
        resolve(row);
      });
    });
    return res;
  }



  // Clear history after last one monthh
  async getClearUserProfile() {
    // Delete all query history, not for profile, serverconn, dbconn, bookmark
    let sql = `DELETE FROM profile WHERE created_at < DATETIME('now', '-30 day') AND type NOT IN (1,2,4,6)`;
    const res = await new Promise((resolve, reject) => {
      db.all(sql,(err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async setLastLogin(userId) {
    let sql = `UPDATE user SET last_login=datetime('now','localtime') WHERE id=${userId}`;
    const res = await new Promise((resolve, reject) => {
      db.all(sql,(err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }
}

module.exports = new ProfileRepository();
