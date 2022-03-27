class TaskDto {
  get task_name() {
    return this._task_name;
  }

  set task_name(new_task_name) {
    this._task_name = new_task_name;
  }

  get source_db_id() {
    return this._source_db_id;
  }

  set source_db_id(new_source_db_id) {
    this._source_db_id = new_source_db_id;
  }

  get target_db_id() {
    return this._target_db_id;
  }

  set target_db_id(new_target_db_id) {
    this._target_db_id = new_target_db_id;
  }

  get note() {
    return this._note;
  }

  set note(new_note) {
    this._note = new_note;
  }

  get user_id() {
    return this._user_id;
  }

  set user_id(new_user_id) {
    this._user_id = new_user_id;
  }
}

module.exports = TaskDto;
