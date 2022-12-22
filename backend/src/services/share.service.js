const ShareRepository = require(`../repositories/share.repository`);
const ShareDto = require(`../dtos/share.dto`);
const DbRepository = require(`../repositories/db.repository`);
const TaskItemService = require(`./task-item.service`);

const fs = require("fs");
const fsExtra = require("fs-extra");
const path = require("path");
const async = require("async");

class ShareService {
  async getAll(filter = "", offset = 0, limit = 10, sort = "desc", userId) {
    return await ShareRepository.getAll(filter, offset, limit, sort, userId);
  }

  async create(data, userId) {
    let taskDto = new ShareDto();
    taskDto.content = data.content;
    taskDto.type = 6;
    taskDto.share_to = data.share_to;
    taskDto.user_id = userId;

    return await ShareRepository.create(taskDto);
  }

  async update(id, title, content) {
    return await ShareRepository.update(id, title, content);
  }

  async delete(id, status) {
    if (status) return await ShareRepository.delete(id, status);
  }
}

module.exports = new ShareService();
