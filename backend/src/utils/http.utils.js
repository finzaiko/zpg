const responseHttp = (reply, code, message, data) => {
  if (typeof code == "undefined") {
    code = 200;
  }
  if (typeof message == "undefined") {
    code = "Ok";
  }
  // if (typeof data.data != "undefined" && data.data.length > 0) {
    let res = {
      meta: {
        code: code,
        message: message,
      },
    };

    // console.log(`data`, data);
    if (typeof data != "undefined") {
      Object.assign(res, data)
    }

    return reply
      .code(code)
      .header(`Content-Type`, `application/json; charset=utf-8`)
      .send(res);
  // }
  // return reply.send([]);
};

const responseOk = (reply, data) => {
  // console.log(`data.data != "undefined"`, data.data != "undefined")
  // console.log(`data.data.length`, data.data)
  if (typeof data.data != "undefined" && data.data.length > 0) {
    return reply
      .code(200)
      .header(`Content-Type`, `application/json; charset=utf-8`)
      .send({
        meta: {
          code: 200,
          message: `Ok`,
        },
        ...data,
      });
  }
  return reply.send([]);
};

const responseValidate = (reply, data) => {
  return reply
    .code(400)
    .header(`Content-Type`, `application/json; charset=utf-8`)
    .send({
      meta: {
        code: 400,
        message: `Error input`,
      },
      ...data,
    });
};

const verifyToken = (fastify, request, reply) => {
  const auth = request.headers.authorization;
  if (typeof auth != "undefined") {
    const token = auth.replace("Bearer", "").trim();
    fastify.jwt.verify(token, (err, decoded) => {
      // console.log(`decoded`, decoded)
      if (!err || typeof decoded != "undefined") {
        reply.send({
          status: decoded.username ? true : null,
          data: Date.now(),
        });
      } else {
        reply.send({ status: null });
      }
    });
  } else {
    reply.send({ status: null });
  }
};

module.exports = { responseHttp, responseOk, responseValidate, verifyToken };
