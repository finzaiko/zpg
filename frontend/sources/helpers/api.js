// import { getToken } from "../models/UserProfile";

import { getToken } from "../models/UserProfile";

export function defaultHeader() {
  return {
    "Content-Type": "application/json",
  };
}

export function setAppHeader(headers) {
  headers["Content-type"] = "application/json";
  headers["Authorization"] = "Bearer " + getToken();
}

export function setDefaultHeader(headers) {
  headers["Content-type"] = "application/json";
}

// export const parseJwt = (token) => {
//   try {
//     return JSON.parse(atob(token.split(".")[1]));
//   } catch (e) {
//     return null;
//   }
// };
