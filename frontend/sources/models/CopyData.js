import { API_URL, CODE_PREFIX } from "../config/setting";

const path = "copydata";

export let state = {
  prefix: CODE_PREFIX + path,
  countPage: 0
};

export const url = API_URL + "/" + path;

