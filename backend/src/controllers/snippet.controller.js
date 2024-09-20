const SnippetService = require(`../services/snippet.service`);
const TaskUserService = require(`../services/task-user.service`);
const TaskItemService = require(`../services/task-item.service`);
const { responseHttp } = require("../utils/http.utils");

const fs = require("fs");

class SnippetController {
  async getAll(request, reply) {
    const { offset, limit, sort } = request.query;
    const userId = request.user.uid;

    const data = await SnippetService.getAll(offset, limit, sort, userId);
    responseHttp(reply, 200, "Ok", { data: data });
  }

  async getById(request, reply) {
    const userId = request.user.uid;
    const data = await SnippetService.getById(request.params.id, userId);
    responseHttp(reply, 200, "Ok", { data: data.length > 0 ? data[0] : null });
  }


  async getSearch(request, reply) {
    const userId = request.user.uid;
    const data = await SnippetService.getSearch(request.query.value, userId);
    console.log('data>>:: ',data);

    responseHttp(reply, 200, "Ok", { data: data });
  }

  // async update(request, reply) {
  //   const userId = request.user.uid;
  //   await SnippetService.update(request.params.id, request.body, userId);

  //   responseHttp(reply, 204, "Updated");
  // }

  // async remove(request, reply) {
  //   const { id } = request.params;
  //   await SnippetService.delete(id);
  //   await TaskItemService.removeByTaskId(id);
  //   responseHttp(reply, 204, "Removed");
  // }
}

module.exports = new SnippetController();
