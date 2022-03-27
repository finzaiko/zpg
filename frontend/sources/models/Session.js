import { defaultHeader } from "../helpers/api";
import { COOKIE_NAME, API_URL } from "../config/setting";
import { setUserProfile } from "./UserProfile";

function status() {
  return webix
    .ajax()
    .headers(defaultHeader())
    .post(`${API_URL}/ping`, { t: Date.now() })
    .then((r) => r.json().status);
}

function login(username, password) {
  return webix
    .ajax()
    .headers(defaultHeader())
    .post(`${API_URL}/auth/login`, {
      username,
      password,
    })
    .then((r) => {
      const cred = r.json();
      if (cred) {
        const token = cred.token;
        setUserProfile(token);
        webix.storage.cookie.put(COOKIE_NAME, token);
      }
      return cred;
    });
}

function logout() {
  return new Promise((resolve, reject) => {
    webix.storage.cookie.remove(COOKIE_NAME);
    resolve(true);
  });
}

export default {
  status,
  login,
  logout,
};
