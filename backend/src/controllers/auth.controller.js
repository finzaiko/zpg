const bcrypt = require("bcrypt");
const UserService = require(`../services/user.service`);
const env = process.env;
const dotenv = require("dotenv");
const refreshToken = require("../utils/token.util");
const { responseValidate } = require("../utils/http.utils");

class AuthController {
  async register(request, reply) {

    const { username, password, fullname, email } = request.body;

    let errors = [];
    if (!username) {
      errors.push("Username required");
    }
    if (!password) {
      errors.push("Password required");
    }
    if (!fullname) {
      errors.push("Fullname required");
    }
    if (!email) {
      errors.push("Email required");
    }
    if (errors.length) {
      responseValidate(reply, { error: errors.join(", ") });
      return;
    }

    await UserService.create(request.body);

    reply
      .code(201)
      .header(`Content-Type`, `application/json; charset=utf-8`)
      .send({
        meta: {
          code: 201,
          message: `Created`,
        },
      });
  }

  async login(request, reply) {
    const { username, password } = request.body;
    let errors = [];
    if (!username) {
      errors.push("Username required");
    }
    if (!password) {
      errors.push("Password required");
    }
    if (errors.length) {
      responseValidate(reply, { error: errors.join(", ") });
      return;
    }

    try {
      const user = await UserService.getByField("username", username);
      if (user && bcrypt.compareSync(password, user.password)) {
        const payload = {
          uid: user.id,
          username: user.username,
          fullname: user.fullname,
          ulv: user.user_level,
        };
        const token = await refreshToken(reply, payload);
        reply.send({ token });
      } else {
        reply
          .code(401)
          .send({ status: false, message: "Invalid email or password." });
      }
    } catch (err) {
      throw err;
    }
  }

  async loginCookie(request, reply) {
    try {
      const { username, password } = request.body;
      const user = await UserService.findOneByField("username", username);
      if (user && bcrypt.compareSync(password, user.password)) {
        let payload = {
          sub: "token",
          name: username,
          iat: Date.now() + 86400,
        };
        const token = await reply.jwtSign(payload);

        reply
          .setCookie("zpgauth", token, {
            httpOnly: true,
            maxAge: Date.now() + 86400,
            sameSite: true,
            path: "/",
            signed: true,
          })
          .send({
            success: true,
            data: "Successfully Logged in",
          });
      } else {
        reply
          .code(401)
          .send({ status: false, message: "Invalid email or password." });
      }
    } catch (err) {
      throw err;
    }
  }
}

module.exports = new AuthController();
