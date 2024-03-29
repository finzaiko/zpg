const TaskService = require(`../services/task.service`);
const TaskUserService = require(`../services/task-user.service`);
const TaskItemService = require(`../services/task-item.service`);
const { responseHttp } = require("../utils/http.utils");

const fs = require("fs");

class TaskController {
  async getAll(request, reply) {
    const { offset, limit, sort } = request.query;
    const userId = request.user.uid;

    const data = await TaskService.getAll(offset, limit, sort, userId);
    responseHttp(reply, 200, "Ok", { data: data });
  }

  async getById(request, reply) {
    const userId = request.user.uid;
    const data = await TaskService.getById(request.params.id, userId);
    responseHttp(reply, 200, "Ok", { data: data.length > 0 ? data[0] : null });
  }

  async create(request, reply) {
    const userId = request.user.uid;
    const data = await TaskService.create(request.body, userId);
    // responseHttp(reply, 201, "Created");
    responseHttp(reply, 201, "Ok", { data: data });
  }

  async createUserAccess(request, reply) {
    const data = await TaskUserService.create(request.body);
    responseHttp(reply, 201, "Ok", { data: data });
  }

  async getUserAccessByField(request, reply) {
    const {field_name, field_value} = request.query;
    const data = await TaskUserService.getByField(field_name, field_value);
    responseHttp(reply, 200, "Ok", { data: data });
  }

  async getUserAccessListByUserId(request, reply) {
    const userId = request.user.uid;
    const data = await TaskUserService.getUserAccessListByUserId(userId);
    responseHttp(reply, 200, "Ok", { data: data });
  }

  async update(request, reply) {
    const userId = request.user.uid;
    await TaskService.update(request.params.id, request.body, userId);

    responseHttp(reply, 204, "Updated");
  }

  async remove(request, reply) {
    const { id } = request.params;
    await TaskService.delete(id);
    await TaskItemService.removeByTaskId(id);
    responseHttp(reply, 204, "Removed");
  }

  async removeUserAccess(request, reply) {
    const { id } = request.params;
    await TaskUserService.delete(id);
    responseHttp(reply, 204, "Removed");
  }

  async checkBrokenFile(request, reply) {
    const userId = request.user.uid;
    const data = await TaskService.checkBrokenFile(request.params.id, userId);
    responseHttp(reply, 200, "Ok", { data: data });
  }

  async transferToTarget(request, reply) {
    const userId = request.user.uid;
    const r = await TaskService.transferToTarget(request.body, userId);
    responseHttp(reply, 200, "Ok", r);
  }

  async downloadBundle(request, reply) {
    const userId = request.user.uid;
    const task = await TaskService.downloadBundle(request.params.id, userId);
    // reply.dowload
    // https://github.com/fastify/fastify/issues/1258
    // https://github.com/fastify/fastify-static#usage
    // https://stackoverflow.com/questions/55884342/how-to-send-file-with-fastify-nestjs
    // responseHttp(reply, 200, "Downloaded success");
    // const stream = fs.createReadStream(resolvePath(task))
    // const stream = fs.createReadStream(task)
    // reply.header("Content-Type", "attachment");
    // reply.type('text/plain').send(stream)
    // reply.sendFile(task)
    const bundle = fs.readFileSync(task.bundle_path, { encoding: "utf-8" });
    reply.send({ status: true, bundle: bundle, name: task.name });
  }
}

module.exports = new TaskController();
