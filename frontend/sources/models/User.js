import { API_URL, CODE_PREFIX } from "../config/setting";
import {defaultHeader} from '../helpers/api';

const path = "user";

export let state = {
  prefix: CODE_PREFIX + path,
  isEdit: false,
  dataSelected: {}
};

export const url = API_URL;

export function register(inputData) {
  return webix
    .ajax()
    .post(`${API_URL}/register`, inputData)
    .then((r) => {
      const cred = r.json();
      return cred;
    });
}