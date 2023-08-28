import { API_URL, CODE_PREFIX } from "../config/setting";
import { runDBQuery } from "../helpers/api";

const path = "administration";

export let state = {
  prefix: CODE_PREFIX + path,
  dataSelected: {},
  // action: null,
  // currentView: null
};

export const url = API_URL + "/" + path;

export const administrationMenuList = [
  {
    id: 1,
    url: "administration.view",
    title: "Version",
    detail: "Database version",
    action: "version",
  },
  {
    id: 2,
    url: "administration.view",
    title: "Pg_hba file",
    detail: "pg_hba.conf file rules",
    action: "pghbaconf",
  },
  {
    id: 3,
    url: "administration.reloadpgconf",
    title: "Reload Config",
    detail: "Reload pg_hba.conf",
    action: "reloadconf",
  },
  {
    id: 4,
    url: "administration.view",
    title: "Database Size",
    detail: "All database size",
    action: "dbsize",
  },
  {
    id: 5,
    url: "administration.view",
    title: "Running queries",
    detail: "Running queries",
    action: "runqueries",
  },
  {
    id: 6,
    url: "administration.view",
    title: "Open connections",
    detail: "Number of open connections",
    action: "connopen",
  },
  {
    id: 7,
    url: "administration.view",
    title: "Active Session",
    detail: "Current active session",
    action: "activesession",
  },
  {
    id: 8,
    url: "administration.view",
    title: "Transaction Hit",
    detail: "DB Transaction Hit",
    action: "transactionhit",
  },
  {
    id: 9,
    url: "administration.view",
    title: "Config Setting",
    detail: "PG Config Setting",
    action: "configsetting",
  },
  {
    id: 10,
    url: "administration.view",
    title: "File Setting",
    detail: "PG File Setting",
    action: "filesetting",
  },
];

export function runReloadConf(inputData) {
  return runDBQuery(url, "reloadconf", inputData);
}

export function runAction(inputData) {
  return runDBQuery(url, "runaction", inputData);
}

export function runView(inputData) {
  return runDBQuery(url, "view", inputData);
}
