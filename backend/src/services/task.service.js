const TaskRepository = require(`../repositories/task.repository`);
const TaskDto = require(`../dtos/task.dto`);
const DbRepository = require(`../repositories/db.repository`);
const TaskItemService = require(`./task-item.service`);

const fs = require("fs");
const fsExtra = require("fs-extra");
const path = require("path");
const async = require("async");

class TaskService {
  async getAll(offset = 0, limit = 10, sort = "desc", userId) {
    return await TaskRepository.getAll(offset, limit, sort, userId);
  }

  async getById(id, userId) {
    const data = await TaskRepository.getById(id, userId);
    return data.rows;
  }

  async getByField(fieldName, fieldValue, userId) {
    const data = await TaskRepository.getByField(fieldName, fieldValue, userId);
    return data[0];
  }

  async create(data, userId) {
    let taskDto = new TaskDto();
    taskDto.task_name = data.task_name;
    taskDto.source_db_id = data.source_db_id;
    taskDto.target_db_id = data.target_db_id;
    taskDto.note = data.note;
    taskDto.user_id = userId;

    return await TaskRepository.create(taskDto);
  }

  async update(id, data, userId) {
    let taskDto = new TaskDto();
    taskDto.task_name = data.task_name;
    taskDto.source_db_id = data.source_db_id;
    taskDto.target_db_id = data.target_db_id;
    taskDto.note = data.note;
    taskDto.user_id = userId;

    return await TaskRepository.update(id, taskDto);
  }

  async delete(id) {
    return await TaskRepository.delete(id);
  }

  async checkBrokenFile(id, userId){
    const task = await TaskRepository.getById(id, userId);
    const dirWp = path.join(__dirname, `../../workspace`);
    const dir = `${dirWp}/task/${(task[0].task_name).replace(/ /g,"_")}`;
    const userCfg = await TaskItemService.getAllByField("task_id", id, userId);
    let emptyFile = [], status = true;

    async.eachSeries(
      userCfg,
      (d, next) => {
        const filePath = `${dir}/${d.name}.sql`;
        try {
          if (fsExtra.existsSync(filePath)) {
            const stats = fsExtra.statSync(filePath);
            if(stats.size<=0){
              emptyFile.push(`${d.name}.sql`);
            }
            status = false;
          }else{
            status = false;
          }
        } catch (error) {
          status = true;
        }
        next();
      },
      () => {
        console.log("done..");
      });
      return {status: status, data: emptyFile.join(", ")}
  }

  async transferToTarget(id, userId) {
    const task = await TaskRepository.getById(id, userId);
    const dirWp = path.join(__dirname, `../../workspace`);
    const dir = `${dirWp}/task/${task[0].task_name.replace(/ /g, "_")}`;

    const glob = require("glob"),
      globPattern = path.join(dir, "**/*.sql"),
      files = glob.sync(globPattern, { nosort: true });

    let result = [];
    async.eachSeries(files, (file, next) => {
      const sql = fsExtra.readFileSync(file, { encoding: "utf-8" });
      result.push(sql);
      next();
    });

    const sqlStr = result.join(";\r\n");
    return await DbRepository.runSql(task[0].target_db_id, userId, sqlStr);
  }

  async downloadBundle(id, userId) {

    const task = await TaskRepository.getById(id, userId);
    const dirWp = path.join(__dirname, `../../workspace`);
    const bundleName = (task[0].task_name).replace(/ /g,"_");
    const dir = `${dirWp}/task/${(task[0].task_name).replace(/ /g,"_")}`;

    const glob = require("glob"),
      globPattern = path.join(dir, "**/*.sql"),
      files = glob.sync(globPattern, { nosort: true });

    let result = [],
      bundleDir = "",
      bundlePath = "";
    bundleDir = `${dirWp}/task/bundle`;
    bundlePath = `${bundleDir}/${(task[0].task_name).replace(/ /g,"_")}_bundle.sql`;
    if (!fs.existsSync(bundleDir)){
      fs.mkdirSync(bundleDir);
    }
    async.eachSeries(files, (file, next) => {
      const sql = fs.readFileSync(file, { encoding: "utf-8" });
      result.push(sql);


      try {
        fs.writeFileSync(bundlePath, result.join(";\r\n\n\n"));
      } catch (error) {
        return error;
      }
      next();
    });
    return {bundle_path: bundlePath, name: bundleName};
  }
}

module.exports = new TaskService();
