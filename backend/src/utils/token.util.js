const env = process.env;
const dotenv = require("dotenv");

const refreshToken = async (reply, payload) => {
  const token = await reply.jwtSign(payload, {
    expiresIn: env.JWT_EXPIRE,
  });
  return token;
};

module.exports = refreshToken;
