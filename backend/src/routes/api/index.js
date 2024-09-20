const apiRoutes = async (app, options) => {
  app.register(require("./app.route"));
  app.register(require("./register.route"));
  app.register(require("./user.route"), { prefix: "users" });
  app.register(require("./auth.route"), { prefix: "auth" });
  app.register(require("./profile.route"), { prefix: "profile" });
  app.register(require("./db.route"), { prefix: "db" });
  app.register(require("./compare.route"), { prefix: "compare" });
  app.register(require("./query.route"), { prefix: "query" });
  app.register(require("./task.route"), { prefix: "task" });
  app.register(require("./task-item.route"), { prefix: "task_item" });
  app.register(require("./generator.route"), { prefix: "generator" });
  app.register(require("./viewdata.route"), { prefix: "viewdata" });
  app.register(require("./share.route"), { prefix: "share" });
  app.register(require("./copydata.route"), { prefix: "copydata" });
  app.register(require("./administration.route"), { prefix: "administration" });
  app.register(require("./setting.route"), { prefix: "setting" });
  app.register(require("./snippet.route"), { prefix: "snippet" });
  app.get("/", async (request, reply) => {
    return {
      message: "API/v1 scope running..",
    };
  });
};

module.exports = apiRoutes;

