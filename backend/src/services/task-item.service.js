// const fs = require("fs");
const fsExtra = require("fs-extra");
const path = require("path");
const async = require("async");
const TaskItemRepository = require(`../repositories/task-item.repository`);
const TaskRepository = require(`../repositories/task.repository`);
const DbRepository = require(`../repositories/db.repository`);
const TaskItemDto = require(`../dtos/task-item.dto`);
const TaskItemSelectedDto = require("../dtos/task-item.dto");
const DbService = require("./db.service");

class TaskItemService {
  async getAll(filter = "", offset = 0, limit = 10, sort = "desc", userId) {
    return await TaskItemRepository.getAll(filter, offset, limit, sort, userId);
  }

  async getById(id, userId) {
    const data = await TaskItemRepository.getById(id, userId);
    return data.rows;
  }

  async getAllByField(fieldName, fieldValue, userId) {
    const data = await TaskItemRepository.getAllByField(fieldName, fieldValue);
    return data;
  }

  async getRunTask(taskId) {
    const data = await TaskItemRepository.getRunTask(taskId);
    return data;
  }

  async create(data) {
    let tasItemDto = new TaskItemDto();
    tasItemDto.task_id = data.task_id;
    tasItemDto.schema = data.schema;
    tasItemDto.func_name = data.func_name;
    tasItemDto.type = data.type;
    tasItemDto.sql_content = data.sql_content;
    tasItemDto.oid = data.oid;
    tasItemDto.seq = data.seq;

    return await TaskItemRepository.create(tasItemDto);
  }

  async createSelected(data, userId) {
    let taskItemSelectedDto = new TaskItemSelectedDto();
    taskItemSelectedDto.task_id = data.task_id;
    taskItemSelectedDto.oid_arr = data.oid_arr;
    taskItemSelectedDto.source_db_id = data.source_db_id;
    await TaskItemRepository.createSelected(taskItemSelectedDto, userId);
    return { msg: "Create selected done" };
  }

  async syncSelected(data, userId) {
    let taskItemSelectedDto = new TaskItemSelectedDto();
    taskItemSelectedDto.task_id = data.task_id;
    taskItemSelectedDto.oid_arr = data.oid_arr;
    taskItemSelectedDto.source_db_id = data.source_db_id;

    await TaskItemRepository.updateAllFuncByTaskId(
      taskItemSelectedDto.source_db_id,
      userId,
      taskItemSelectedDto.task_id
    );
    return { msg: "Sync selected done" };
  }

  sleep(millis) {
    return new Promise((resolve) => setTimeout(resolve, millis));
  }

  async changeStatus(data) {
    return await TaskItemRepository.changeStatus(data);
  }

  async update(id, data) {
    let tasItemkDto = new TaskItemDto();
    tasItemkDto.task_id = data.task_id;
    tasItemkDto.func_name = data.func_name;
    tasItemkDto.type = data.type;
    tasItemkDto.sql_content = data.sql_content;
    tasItemkDto.oid = data.oid;

    return await TaskItemRepository.update(id, tasItemkDto);
  }

  async updateByField(key, value, data) {
    let tasItemkDto = new TaskItemDto();
    tasItemkDto.task_id = data.task_id;
    tasItemkDto.func_name = data.func_name;
    tasItemkDto.type = data.type;
    tasItemkDto.sql_content = data.sql_content;
    tasItemkDto.oid = data.oid;

    return await TaskItemRepository.updateByField(key, value, tasItemkDto);
  }

  async updateQue(data) {
    const inputData = JSON.parse(data.data);
    const taskId = data.task_id;
    const result = await TaskItemRepository.updateSequence(taskId, inputData);
    return { result };
  }

  async updateToggledr(data) {
    const result = await TaskItemRepository.updateToggleDropReplace(data.task_id, data.is_yes);
    return { result };
  }

  async delete(id) {
    return await TaskItemRepository.delete(id);
  }

  async removeSelected(data) {
    return await TaskItemRepository.deleteSelected(data);
  }

  /*
  async syncSelected(id, sourceId, userId) {
    const allData = await DbService.getSchemaContent(
      sourceId,
      null,
      null,
      null,
      null,
      userId
    );
    const itemData = await this.getAllByField("task_id", id, userId);
    let oidArr = itemData
      .map((el) => {
        const obj = allData.find(
          (e) => e.name == el.name && e.params_in == el.params_in
        );
        return obj.id;
      })
      .join(",");

    const input = {
      oid_arr: oidArr,
      source_db_id: sourceId,
      task_id: id,
    };
    return this.createSelected(input, userId);
  }
  */

  async writeToWorkspace(id, userId) {
    const task = await TaskRepository.getById(id, userId);
    const dirWp = path.join(__dirname, `../../workspace`);
    const dir = `${dirWp}/task/${task[0].task_name.replace(/ /g, "_")}`;

    fsExtra.ensureDirSync(dir);
    fsExtra.emptyDirSync(dir);

    const userCfg = await this.getAllByField("task_id", id, userId);
    async.eachSeries(
      userCfg,
      (d, next) => {
        DbRepository.getSqlFunc(task[0].source_db_id, d.oid, userId).then(
          (r2) => {
            fsExtra.writeFileSync(`${dir}/${d.name}.sql`, r2.rows[0].sqlfunc);
          }
        );
        next();
      },
      () => {
        console.log("done..");
      }
    );
  }

  async clearWorkspace(id, userId) {
    const task = await TaskRepository.getById(id, userId);
    const dirWp = path.join(__dirname, `../../workspace`);
    const dir = `${dirWp}/task/${task[0].task_name.replace(/ /g, "_")}`;

    fsExtra.ensureDirSync(dir);
    fsExtra.emptyDirSync(dir);
    return { status: true, message: "Workspace empty" };
  }
}

module.exports = new TaskItemService();
