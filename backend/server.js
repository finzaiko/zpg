const Fastify = require("fastify");
const qs = require("qs");
const path = require("path");

const NODE_ENV = "development";
const JWT_SECRET = "raHa$1a";
// const COOKIE_SECRET = "KueraHa$1a";

const logger = {
  development: {
    prettyPrint: {
      colorize: true,
      levelFirst: true,
      ignore: "time,pid,hostname",
    },
  },
  production: {
    formatters: {
      level(level) {
        return { level };
      },
    },
    timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
  },
};

const app = async () => {
  const fastify = Fastify({
    bodyLimit: 1048576 * 2,
    logger: logger[NODE_ENV],
    querystringParser: (str) => qs.parse(str),
    // https: {
    //   key: fs.readFileSync(path.join(__dirname, 'file.key')),
    //   cert: fs.readFileSync(path.join(__dirname, 'file.cert'))
    // }
  });

  // await fastify.register(require('./plugins/db'))

  await fastify.register(require("fastify-static"), {
    root: path.join(__dirname, "public"),
  });

  await fastify.register(require("fastify-jwt"), {
    secret: JWT_SECRET,
    messages: {
      badRequestErrorMessage: "Format is Authorization: Bearer [token]",
      noAuthorizationInHeaderMessage:
        "You are unauthorized to access this resource",
      authorizationTokenExpiredMessage: "Authorization token expired",
      authorizationTokenInvalid: (err) => {
        return `Authorization token is invalid: ${err.message}`;
      },
    },
  });

  /*
  await fastify.register(require('fastify-cookie'), {
    secret: COOKIE_SECRET
  })
  */

  fastify.get("/", async (request, reply) => {
    // return {
    //   message: "Server running..",
    // };
    return reply.sendFile("index.html");
  });

  await fastify.register(require("fastify-cors"), { origin: "*" });
  await fastify.register(require("./src/routes/api"), { prefix: "api/v1" });
  await fastify.register(require("./src/hooks"));

  return fastify;
};

module.exports = {
  app,
};
