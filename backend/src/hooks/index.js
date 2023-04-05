const fastifyPlugin = require("fastify-plugin");

module.exports = fastifyPlugin((fastify, options, next) => {
  fastify.addHook("onRequest", async (request, reply) => {
    // console.log(`test-url>>>>>>>>`, /^\/$/.test(request.url))
    try {
      // !/\/auth.*|\/v1$/.test(request.url) &&
      if (
        !/\/assets.*$/.test(request.url) &&
        !/\/fonts.*$/.test(request.url) &&
        !/^\/$/.test(request.url) && // base url
        !/\/auth\/login.*|\/v1$/.test(request.url) &&
        !/\/register|\/v1$/.test(request.url) &&
        !/\/ping|\/v1$/.test(request.url) &&
        !/\/taskbundle|\/v1$/.test(request.url) &&
        !/\/meta|\/v1$/.test(request.url) &&
        !/\/erviewer$/.test(request.url)
      ) {
        await request.jwtVerify();
      }
    } catch (err) {
      reply.send(err);
    }
  });
  next();
});
