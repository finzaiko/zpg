const TaskItemController = require("../../controllers/task-item.controller");

module.exports = async (fastify) => {
  fastify.get(`/`, TaskItemController.getAll);
  fastify.get(`/:id`, TaskItemController.getById);
  fastify.post(`/`, TaskItemController.create);
  fastify.post(`/que`, TaskItemController.updateQue);
  fastify.post(`/selected`, TaskItemController.createSelected);
  fastify.post(`/change`, TaskItemController.changeStatus);
  fastify.post(`/rmselected`, TaskItemController.removeSelected);
  fastify.post(`/syncselected`, TaskItemController.syncSelected);
  fastify.put(`/:id`, TaskItemController.update);
  fastify.delete(`/:id`, TaskItemController.remove);
};
