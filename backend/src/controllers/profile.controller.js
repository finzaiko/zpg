const ProfileService = require(`../services/profile.service`);
const { responseOk, responseHttp } = require("../utils/http.utils");
const { ENCRYPT_PASSWORD } = require("../config/contant");

class ProfileController {
  async findAll(request, reply) {
    const { type, ls, sa, limit, start, search } = request.query; // sa= show all
    const userId = request.user.uid;
    const data = await ProfileService.findAll(
      type,
      userId,
      ls,
      sa,
      limit,
      start,
      search
    );
    const dataCount = await ProfileService.countAll(
      type,
      userId,
      ls,
      sa,
      limit,
      start,
      search
    );

    responseHttp(reply, 200, "Ok", {
      data: data,
      pos: parseInt(start) || 0,
      total_count: dataCount[0].total_count || 0,
    });
  }

  async getById(request, reply) {
    const userId = request.user.uid;
    const data = await ProfileService.getById(
      request.params.id,
      request.query.type,
      userId
    );
    responseHttp(reply, 200, "Ok", { data: data });
  }

  async check(request, reply) {
    const userId = request.user.uid;
    const data = await ProfileService.check(
      request.query.id,
      2,
      request.query.db,
      userId
    );
    responseHttp(reply, 200, "Ok", { data: true, is_new: data });
  }

  async createConn(request, reply) {
    const userId = request.user.uid;
    await ProfileService.createConn(request.body);
    responseHttp(reply, 201, "Conn created");
  }

  async updateQue(request, reply) {
    const userId = request.user.uid;
    await ProfileService.updateQue(userId, request.body);
    responseHttp(reply, 201, "Que updated");
  }

  async updateConn(request, reply) {
    const userId = request.user.uid;
    await ProfileService.updateConn(request.params.id, request.body);
    responseHttp(reply, 204, "Conn updated");
  }

  async removeConn(request, reply) {
    await ProfileService.deleteConn(request.params.id);
    responseHttp(reply, 204, "Conn removed");
  }

  async testConn(request, reply) {
    const data = await ProfileService.testConn(request.body);
    // console.log(`data>>>>>>>>>>>>`, data);
    reply
      .code(200)
      .header(`Content-Type`, `application/json; charset=utf-8`)
      .send({ status: data.rowCount > 0 });
  }

  async createContent(request, reply) {
    const userId = request.user.uid;
    await ProfileService.createContent(request.body, userId);
    responseHttp(reply, 201, "Content created");
  }

  async copyConnContent(request, reply) {
    const userId = request.user.uid;

    const { id, server, copydb } = request.body;
    const data = await ProfileService.getById(id, 5, userId);
    data.conn_name = `${copydb} (${server})`;
    data.type = 2;
    data.database = copydb;

    await ProfileService.createConn(data, userId);
    responseHttp(reply, 201, "Content created");
  }

  async updateContent(request, reply) {
    const userId = request.user.uid;
    await ProfileService.updateContent(request.params.id, request.body, userId);
    responseHttp(reply, 204, "Content updated");
  }

  async removeContent(request, reply) {
    const userId = request.user.uid;
    await ProfileService.deleteContent(request.params.id, userId);
    responseHttp(reply, 204, "Content removed");
  }

  async getUserProfile(request, reply) {
    const userId = request.user.uid;
    const data = await ProfileService.getUserProfile(userId);
    responseHttp(reply, 200, "Ok", { data: data });
  }

  async getExport(request, reply) {
    const userId = request.user.uid;
    const data = await ProfileService.getExport(userId);
    responseOk(reply, { data: data, pass: ENCRYPT_PASSWORD });
  }

  async setImport(request, reply) {
    const userId = request.user.uid;
    await ProfileService.setImport(userId, request.body);
    responseHttp(reply, 201, "File imported");
  }
}

module.exports = new ProfileController();
