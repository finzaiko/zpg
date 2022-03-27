
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

