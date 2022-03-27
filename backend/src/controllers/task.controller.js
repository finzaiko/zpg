const TaskService = require(`../services/task.service`);
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
    responseHttp(reply, 201, "Ok", { data: data });
  }

  async update(request, reply) {
    const userId = request.user.uid;
    await TaskService.update(request.params.id, request.body, userId);

    responseHttp(reply, 204, "Updated");
  }

  async remove(request, reply) {
    await TaskService.delete(request.params.id);
    responseHttp(reply, 204, "Removed");
  }

  async checkBrokenFile(request, reply) {
    const userId = request.user.uid;
    const data = await TaskService.checkBrokenFile(request.params.id, userId);
    responseHttp(reply, 200, "Ok", { data: data });
  }

  async transferToTarget(request, reply) {
    const userId = request.user.uid;
    await TaskService.transferToTarget(request.params.id, userId);
    responseHttp(reply, 204, "Removed");
  }

  async downloadBundle(request, reply) {
    const userId = request.user.uid;
    const task = await TaskService.downloadBundle(request.params.id, userId);
    const bundle = fs.readFileSync(task.bundle_path, { encoding: "utf-8" });
    reply.send({status: true, bundle: bundle, name: task.name}) 
  }
}

module.exports = new TaskController();
