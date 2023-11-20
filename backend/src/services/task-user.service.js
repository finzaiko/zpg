const TaskUserRepository = require(`../repositories/task-user.repository`);
const TaskUserDto = require(`../dtos/task-user.dto`);

class TaskUserService {
  async getAll(offset = 0, limit = 10, sort = "desc", userId) {
    return await TaskUserRepository.getAll(offset, limit, sort, userId);
  }

  async getById(id, userId) {
    const data = await TaskUserRepository.getById(id, userId);
    return data.rows;
  }

  async getAddTaskByUserId(userId) {
    const data = await TaskUserRepository.getAddTaskByUserId( userId);
    return data;
  }

  async getByField(fieldName, fieldValue) {
    const data = await TaskUserRepository.getByField(fieldName, fieldValue);
    return data;
  }

  async create(data) {
    let taskDto = new TaskUserDto();
    taskDto.task_id = data.task_id;
    taskDto.user_id = data.user_id;

    return await TaskUserRepository.create(taskDto);
  }

  async update(id, data) {
    let taskDto = new TaskUserDto();
    taskDto.task_id = data.task_id;
    taskDto.user_id = data.user_id;
    return await TaskUserRepository.update(id, taskDto);
  }

  async delete(id) {
    return await TaskUserRepository.delete(id);
  }
}

module.exports = new TaskUserService();
