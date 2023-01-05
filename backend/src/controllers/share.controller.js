const ShareService = require(`../services/share.service`);
const { responseHttp } = require("../utils/http.utils");

class TaskController {
  async getAll(request, reply) {
    const { filter, offset, limit, sort } = request.query;
    const userId = request.user.uid;

    const data = await ShareService.getAll(filter, offset, limit, sort, userId);
    responseHttp(reply, 200, "Ok", { data: data });
  }

  async getByField(request, reply) {
    const { field, value } = request.query;
    const userId = request.user.uid;

    const data = await ShareService.getByField(field, value, userId);
    responseHttp(reply, 200, "Ok", { data: data });
  }

  async create(request, reply) {
    const userId = request.user.uid;
    const data = await ShareService.create(request.body, userId);
    responseHttp(reply, 201, "Ok", { data: data });
  }

  async update(request, reply) {
    const { title, content } = request.body;
    await ShareService.update(request.params.id, title, content);
    responseHttp(reply, 204, "Updated");
  }

  async remove(request, reply) {
    const { id, status } = request.params;
    await ShareService.delete(id, status);
    responseHttp(reply, 204, "Removed");
  }
}

module.exports = new TaskController();
