const TaskItemService = require(`../services/task-item.service`);
const { responseHttp } = require("../utils/http.utils");

class TaskItemController {
  async getAll(request, reply) {
    const { filter, offset, limit, sort } = request.query;
    const userId = request.user.uid;

    const data = await TaskItemService.getAll(
      filter,
      offset,
      limit,
      sort,
      userId
    );
    responseHttp(reply, 200, "Ok", { data: data });
  }

  async getById(request, reply) {
    const userId = request.user.uid;
    const data = await TaskItemService.getById(request.params.id, userId);
    responseHttp(reply, 200, "Ok", { data: data.length > 0 ? data[0] : null });
  }

  async create(request, reply) {
    await TaskItemService.create(request.body);
    responseHttp(reply, 201, "Created");
  }

  async createSelected(request, reply) {
    const userId = request.user.uid;
    await TaskItemService.createSelected(request.body, userId);
    responseHttp(reply, 201, "Created selected");
  }

  async syncSelected(request, reply) {
    const userId = request.user.uid;
    await TaskItemService.syncSelected(request.body, userId);
    responseHttp(reply, 201, "Sync selected");
  }

  async changeStatus(request, reply) {
    const userId = request.user.uid;
    await TaskItemService.changeStatus(request.body, userId);
    responseHttp(reply, 201, "Status changed");
  }

  async update(request, reply) {
    await TaskItemService.update(request.params.id, request.body);
    responseHttp(reply, 204, "Updated");
  }

  async updateQue(request, reply) {
    await TaskItemService.updateQue(request.body);
    responseHttp(reply, 201, "Que updated");
  }

  async updateToggledr(request, reply) {
    await TaskItemService.updateToggledr(request.body);
    responseHttp(reply, 201, "Toggle drop replace updated");
  }

  async remove(request, reply) {
    await TaskItemService.delete(request.params.id);
    responseHttp(reply, 204, "Removed");
  }

  async removeSelected(request, reply) {
    await TaskItemService.removeSelected(request.body);
    responseHttp(reply, 204, "Removed");
  }
}

module.exports = new TaskItemController();
