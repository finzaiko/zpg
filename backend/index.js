const { app: server } = require("./server");
const env = process.env;
const dotenv = require("dotenv");

dotenv.config({ path: __dirname + "/.env" });

server()
  .then((app) => {
    env;
    app
      .listen(env.APP_PORT, "0.0.0.0")
      // .then((_) => {})
      .catch((err) => {
        console.log("Error starting server: ", err);
        process.exit(1);
      });
  })
  .catch((err) => console.log(err));
