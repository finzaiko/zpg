const pool = require("../config/db");
const { db } = require("../core/database");
const bcrypt = require("bcrypt");

class UserRepository {
  async getAll() {
    const fields = `id, fullname, email, username, user_level, access_group`;
    let sql = `SELECT ${fields} FROM user`;
    sql += " ORDER BY id DESC";
    let params = [];
    const res = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async getById(id) {
    const sql = "SELECT * FROM user WHERE id=?";
    const params = [id];
    const res = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async getByField(fieldName, fieldValue) {
    const sql = `SELECT * FROM user WHERE ${fieldName}=?`;
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
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const cryptPassword = bcrypt.hashSync(data.password, salt);

    const userLevel =
      typeof data.user_level != "undefined" ? data.user_level : 3;
    const accessGroup =
      typeof data.access_group != "undefined" ? data.access_group : "";
    const sql =
      "INSERT INTO user (fullname, email, username, password, salt, user_level, access_group) VALUES (?,?,?,?,?,NULLIF(?,''),NULLIF(?,''))";
    let params = [
      data.fullname,
      (data.email).toLowerCase(),
      (data.username).toLowerCase(),
      cryptPassword,
      salt,
      userLevel,
      accessGroup,
    ];

    const res = await new Promise((resolve, reject) => {
      db.run(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async update(id, data) {
    const userLevel =
      typeof data.user_level != "undefined" ? data.user_level : 3;
    const accessGroup =
      typeof data.access_group != "undefined" ? data.access_group : "";


    let pass = "";
    if(data.password!=""){
      pass = "password=?, "
    }

    const sql = `UPDATE user SET ${pass} fullname=?, email=?, username=?, user_level=NULLIF(?,''), access_group=NULLIF(?,'') WHERE id=?`;
    // delete data.password;
    let params = [
      data.fullname,
      data.email,
      data.username,
      userLevel,
      accessGroup,
      id,
    ];

    if(data.password!=""){
      const saltRounds = 10;
      const salt = bcrypt.genSaltSync(saltRounds);
      const cryptPassword = bcrypt.hashSync(data.password, salt);
      params = [cryptPassword, ...params];
    }

    const res = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    return res;
  }

  async changePassword(id, oldPassword, newPassword) {
    const user = await this.getById(id);

    let res = await new Promise((resolve, reject) => {
      if (user && bcrypt.compareSync(oldPassword, user[0].password)) {
        const saltRounds = 10;
        const salt = bcrypt.genSaltSync(saltRounds);
        const cryptPassword = bcrypt.hashSync(newPassword, salt);

        const sql = `UPDATE user SET password=?, salt=? WHERE id=?`;
        let params = [cryptPassword, salt, id];

        db.all(sql, params, (err, row) => {
          if (err) reject(err);
          resolve(row);
        });
      } else {
        reject({ message: `Incorrect old password` });
      }
    });
    return res;
  }

  async delete(id) {
    const sql = "DELETE FROM user WHERE id=?";
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

module.exports = new UserRepository();
