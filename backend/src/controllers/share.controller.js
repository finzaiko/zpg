const ShareService = require(`../services/share.service`);
const { responseHttp } = require("../utils/http.utils");

class TaskController {
  async getAll(request, reply) {
    const { filter, offset, limit, sort } = request.query;
    const userId = request.user.uid;

    const data = await ShareService.getAll(filter, offset, limit, sort, userId);
    responseHttp(reply, 200, "Ok", { data: data });
  }

  async create(request, reply) {
    const userId = request.user.uid;
    const data = await ShareService.create(request.body, userId);
    // responseHttp(reply, 201, "Created");
    responseHttp(reply, 201, "Ok", { data: data });
  }

}

module.exports = new TaskController();
