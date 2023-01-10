import { CODE_PREFIX } from "../config/setting";
import { defaultHeader } from "../helpers/api";
import { url as urlProfile } from "./Profile";

const path = "database";

export let state = {
  prefix: CODE_PREFIX + path,
  isEdit: false,
  dataSelected: {}
};


export const testConnection = (isPromise, data) => {
  const test = webix
    .ajax()
    // .headers(defaultHeader())
    .post(urlProfile + "/conn/test", data, function (res) {
      console.log(`res`, res);
      webix.message({ text: "Connection Ok", type: "success" });
      return res;
    })
    .fail(function (err) {
      const _res = JSON.parse(err.response);
      webix.alert({
        type: "alert-error",
        title: "Connection Failed",
        text: `Can't Connect to Database Server<br>${_res.message}`,
      });
      return err;
    });
  if (isPromise) {
    return test;
  }
};
