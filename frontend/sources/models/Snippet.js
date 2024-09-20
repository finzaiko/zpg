import { API_URL, CODE_PREFIX } from "../config/setting";

const path = "snippet";

export let state = {
  prefix: CODE_PREFIX + path,
  isEdit: false,
  isEditItem: false,
  dataSelected: {},
  dataSelectedItem: {}
};

export const url = API_URL + "/" + path;
