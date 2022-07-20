// import { url as urlProfile } from "../models/Profile";
// import { defaultHeader } from "./ui";

// export const testConnection = (isPromise, data) => {
//   const test = webix
//     .ajax()
//     .headers(defaultHeader())
//     .post(urlProfile + "/conn/test", data, function (res) {
//       console.log(`res`, res);
//       webix.message({ text: "Connection Ok" });
//       return res;
//     })
//     .fail(function (err) {
//       const _res = JSON.parse(err.response);
//       webix.alert({
//         type: "alert-error",
//         title: "Connection Failed",
//         text: `Can't Connect to Database Server<br>${_res.message}`,
//       });
//       return err;
//     });
//   if (isPromise) {
//     return test;
//   }
// };
