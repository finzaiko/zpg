import { API_URL, CODE_PREFIX } from "../config/setting";
import { runDBQuery } from "../helpers/api";

const path = "administration";

export let state = {
  prefix: CODE_PREFIX + path,
};

export const url = API_URL + "/" + path;

export const administrationMenuList = [
  {
    id: "administration.reloadpgconf",
    title: "Reload PG Config",
    detail: "Reload pg_hba.conf",
  },
  // {
  //   id: "administration.dbsize",
  //   title: "Show Database size",
  //   detail: "Show all database size",
  // },
];

export function runReloadConf(inputData) {
  return runDBQuery(url, "reloadconf", inputData);
}
