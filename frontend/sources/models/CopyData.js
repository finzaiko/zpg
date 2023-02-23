import { API_URL, CODE_PREFIX } from "../config/setting";

const path = "copydata";

export let state = {
  prefix: CODE_PREFIX + path,
  countPage: 0,
  tableName: "",
  tableFields: {},
};

export const url = API_URL + "/" + path;


export function checkTableExist(inputData) {
  return webix
    .ajax()
    .post(`${url}/check_table`, inputData)
    .then((data) => data.json());
}

export function runCopyData(inputData) {
  return webix
    .ajax()
    .post(`${url}/runcopy`, inputData)
    .then((data) => data.json());
}

export function runCreateTable(inputData) {
  return webix
    .ajax()
    .post(`${url}/create_table`, inputData)
    .then((data) => data.json());
}
