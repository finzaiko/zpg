// import { url as urlProfile } from "../models/Profile";
// import { defaultHeader } from "./ui";

// export const testConnection = (isPromise, data) => {
//   const test = webix
//     .ajax()
//     .post(urlProfile + "/conn/test", data, function (res) {
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

// export function isOnline() {
//   return new Promise((resolve, reject) => {
//     if (navigator.onLine) {
//       const isNetOk = isReachable(getServerUrl()).then((ol) => ol);
//       if (isNetOk) {
//         resolve(isNetOk);
//       } else {
//         resolve(true);
//       }
//     } else {
//       resolve(false);
//     }
//   });
// }

export function isConnReachable(url) {
  const options = {
    timeout: 3000,
    method: "HEAD",
    mode: "no-cors",
  };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout);
  try {
    return fetch(`http://${url}`, {
      ...options,
      signal: controller.signal,
    }).then((resp) => {
      const res = resp && (resp.ok || resp.type === "opaque");
      clearTimeout(timeoutId);
      return res;
    });
  } catch (err) {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}
