const fastifyPlugin = require("fastify-plugin");

module.exports = fastifyPlugin((fastify, options, next) => {
  fastify.addHook("onRequest", async (request, reply) => {
    try {
      if (!/\/auth.*|\/v1$/.test(request.url)) {
        if (typeof request.cookies["zpgauth"] === "undefined") {
          return reply.code(401).send({ status: false, message: "No auth" });
        } else {
          await request.jwtVerify();
        }
      }
    } catch (err) {
      reply.send(err);
    }
  });

  next();
});
