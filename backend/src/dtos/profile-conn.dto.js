class ProfileConnDto {
  get conn_name() {
    return this._conn_name;
  }

  set conn_name(conn_name) {
    this._conn_name = conn_name;
  }

  get host() {
    return this._host;
  }

  set host(host) {
    this._host = host;
  }

  get port() {
    return this._port;
  }

  set port(port) {
    this._port = port;
  }

  get database() {
    return this._database;
  }

  set database(database) {
    this._database = database;
  }

  get user() {
    return this._user;
  }

  set user(user) {
    this._user = user;
  }

  get password() {
    return this._password;
  }

  set password(password) {
    this._password = password;
  }

  get type() {
    return this._type;
  }

  set type(type) {
    this._type = type;
  }

  get user_id() {
    return this._user_id;
  }

  set user_id(user_id) {
    this._user_id = user_id;
  }

  get ssl() {
    return this._ssl;
  }

  set ssl(ssl) {
    this._ssl = ssl;
  }

  get content() {
    return this._content;
  }

  set content(content) {
    this._content = content;
  }
}

module.exports = ProfileConnDto;
