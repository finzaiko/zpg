import { API_URL, CODE_PREFIX } from "../config/setting";

const path = "compare";

export let state = {
    prefix: CODE_PREFIX + path,
  };

export const url = API_URL + "/" + path;
