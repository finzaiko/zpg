const UserService = require(`../services/user.service`);
const { responseHttp } = require("../utils/http.utils");

class UserController {
  async getAll(request, reply) {
    const { offset, limit, sort, search, type } = request.query;

    const data = await UserService.getAll(offset, limit, sort, search, type);
    responseHttp(reply, 200, "Ok", { data: data });
  }

  async getById(request, reply) {
    const data = await UserService.findOne(request.params.id);
    responseHttp(reply, 200, "Ok", { data: data.length > 0 ? data[0] : null });
  }

  async create(request, reply) {
    await UserService.create(request.body);
    responseHttp(reply, 201, "Created");
  }

  async update(request, reply) {
    await UserService.update(request.params.id, request.body);
    responseHttp(reply, 204, "Updated");
  }

  async changePassword(request, reply) {
    await UserService.changePassword(request.params.id, request.body);
    responseHttp(reply, 200, "Changed");
  }

  async remove(request, reply) {
    await UserService.delete(request.params.id);
    responseHttp(reply, 204, "Removed");
  }
}

module.exports = new UserController();
