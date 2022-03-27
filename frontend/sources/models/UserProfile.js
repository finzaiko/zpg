import { COOKIE_NAME } from "../config/setting";

export let userProfile = {
  userId: 0,
  token: "",
  username: "",
  userLevel: 0,
  fullname: "",
};

const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    return null;
  }
};

export const setUserProfile = (token) => {
  const decoded = parseJwt(token);
  if (decoded != null) {
    userProfile.token = token;
    userProfile.userId = decoded.uid;
    userProfile.userLevel = decoded.ulv;
    userProfile.username = decoded.username;
    userProfile.fullname = decoded.fullname;
  }
};

export function getToken() {
  const userSess = webix.storage.cookie.get(COOKIE_NAME);
  const token = userProfile.token || userSess;
  if (token) {
    setUserProfile(token);
  }
  return token;
}

export function initSession() {
  getToken();
}
