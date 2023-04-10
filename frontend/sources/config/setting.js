export const APP_NAME = "ZPG";

export const VERSION = "1.0.13-dev";
export const CODE_PREFIX = "z_";

const HOST = `localhost`;
export const DEV_MODE = location.port ? true : false;
export const BUILD_MODE = process.env.BUILD_MODE ? "desktop" : "web";
export const BASE_URL = process.env.SERVER_URL;
export const FRONTEND_URL = `http://${HOST}:${location.port}`;
export const BACKEND_URL = BASE_URL;
export const API_URL = `${BACKEND_URL}/api/v1`;
export const LINK_URL =
  process.env.NODE_ENV == "development" ? FRONTEND_URL : BACKEND_URL;

export const COOKIE_NAME = "zpgtool";
export const COOKIE_APP = COOKIE_NAME + "_app";

export const SHOW_ERR_DEBUG = true;

export const LAST_DB_SERVER = "ldbserver";
export const LAST_DB_CONN_QUERY = "ldbconn";
export const LAST_DB_CONN_VIEWDATA = "lvdbconn";

export const LAST_DATATYPE = "ldtype";
export const LAST_SEARCHTYPE = "lstype";
export const LAST_MINIMAP = "lsmnmap";
export const LAST_SIDEBAR = "lssdbar";
export const LAST_MULTICONN = "lsmconn";
export const LAST_HISTORY = "lshistory";
export const LAST_ADJUSTCOLS = "ldjustcols";
export const STORE_HISTORY = "sthistory";
export const CONFIRM_DROP_REPLACE = "dropreplace";
export const CONFIRM_EXECUTE = "confirmexec";

export const PING_SERVER = 15 * 60000; // Every 15m
export const LOGIN_ANIMATE = true;
export const FONT_SIZE_EDITOR = 14; // Defalt font size monaco editor