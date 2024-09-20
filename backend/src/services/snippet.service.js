const SnippetRepository = require(`../repositories/snippet.repository`);
// const TaskDto = require(`../dtos/task.dto`);
// const DbRepository = require(`../repositories/db.repository`);
// const TaskItemService = require(`./task-item.service`);
// const BaseRepository = require(`../repositories/base.repository`);
const { sqlSyntax } = require("../core/sql/syntax.sql");

const fs = require("fs");
const fsExtra = require("fs-extra");
const path = require("path");
const async = require("async");

class SnippetService {
  async getAll(offset = 0, limit = 100, sort = "desc", userId) {
    const data = await SnippetRepository.getAll(offset, limit, sort, userId);
    return data;
    // return [...sqlSyntax, ...data];
  }

  async getById(id, userId) {
    const data = await SnippetRepository.getById(id, userId);
    return data.rows;
  }

  async getSearch(fieldValue, userId) {
    const data = await SnippetRepository.getSearch(fieldValue, userId);
    return data;
  }

  // async create(data, userId) {
  //   let taskDto = new TaskDto();
  //   taskDto.task_name = data.task_name;
  //   taskDto.source_db_id = data.source_db_id;
  //   taskDto.target_db_id = data.target_db_id;
  //   taskDto.note = data.note;
  //   taskDto.user_id = userId;

  //   return await SnippetRepository.create(taskDto);
  // }

  // async update(id, data, userId) {
  //   let taskDto = new TaskDto();
  //   taskDto.task_name = data.task_name;
  //   taskDto.source_db_id = data.source_db_id;
  //   taskDto.target_db_id = data.target_db_id;
  //   taskDto.note = data.note;
  //   taskDto.user_id = userId;

  //   return await SnippetRepository.update(id, taskDto);
  // }

  // async delete(id) {
  //   return await SnippetRepository.delete(id);
  // }
}

module.exports = new SnippetService();
