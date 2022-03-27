class TaskItemDto {

  get task_id() {
    return this._task_id;
  }

  set task_id(new_task_id) {
    this._task_id = new_task_id;
  }

  get func_name() {
    return this._func_name;
  }

  set func_name(new_func_name) {
    this._func_name = new_func_name;
  }

  get type() {
    return this._type;
  }

  set type(new_type) {
    this._type = new_type;
  }

  get sql_content() {
    return this._sql_content;
  }

  set sql_content(new_sql_content) {
    this._sql_content = new_sql_content;
  }

  get oid() {
    return this._oid;
  }

  set oid(new_oid) {
    this._oid = new_oid;
  }
}

module.exports = TaskItemDto;
