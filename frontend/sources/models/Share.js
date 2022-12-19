import { API_URL, CODE_PREFIX } from "../config/setting";

const path = "share";

export let state = {
  prefix: CODE_PREFIX + path,
  isEdit: false,
  dataSelected: {}
};

export const url = API_URL + "/" + path;
