import { API_URL, CODE_PREFIX } from "../config/setting";

const path = "task";

export let state = {
  prefix: CODE_PREFIX + path,
  isEdit: false,
  dataSelected: {}
};

export const url = API_URL + "/" + path;
export const urlItem = API_URL + "/" + path+"_item";
