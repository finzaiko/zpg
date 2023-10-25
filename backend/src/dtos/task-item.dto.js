class TaskItemDto {
  get task_id() {
    return this._task_id;
  }

  set task_id(new_task_id) {
    this._task_id = new_task_id;
  }
  get oid_arr() {
    return this._oid_arr;
  }

  set oid_arr(new_oid_arr) {
    this._oid_arr = new_oid_arr;
  }
  get source_db_id() {
    return this._source_db_id;
  }

  set source_db_id(new_source_db_id) {
    this._source_db_id = new_source_db_id;
  }

  get schema() {
    return this._schema;
  }

  set schema(new_schema) {
    this._schema = new_schema;
  }

  get func_name() {
    return this._func_name;
  }

  set func_name(new_func_name) {
    this._func_name = new_func_name;
  }

  get sql_content() {
    return this._sql_content;
  }

  set sql_content(new_sql_content) {
    this._sql_content = new_sql_content;
  }

  get seq() {
    return this._seq;
  }

  set seq(new_seq) {
    this._seq = new_seq;
  }
}

module.exports = TaskItemDto;
