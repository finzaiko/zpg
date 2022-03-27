class TaskItemSelectedDto {

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
}

module.exports = TaskItemSelectedDto;
