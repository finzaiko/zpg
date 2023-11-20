class TaskUserDto {
  get task_id() {
    return this._task_id;
  }

  set task_id(new_task_id) {
    this._task_id = new_task_id;
  }

  get user_id() {
    return this._user_id;
  }

  set user_id(new_user_id) {
    this._user_id = new_user_id;
  }
}

module.exports = TaskUserDto;
