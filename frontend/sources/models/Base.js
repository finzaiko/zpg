// import { BACKEND_URL, COOKIE_APP } from "../config/setting";

import { routeName } from "../views/routes";

export let state = {
  viewScope: {},
  currentTabQuery: 0,
  currentTabViewData: 0,
  currentDBSelected: "",
  meta: {},
  appProfile: {}
};

// export function getAppConfig() {
//   let appName = webix.storage.cookie.get(COOKIE_APP);
//   if (appName !== "null" || appName) {
//     webix
//       .ajax()
//       .get(`${BACKEND_URL}/app/config`)
//       .then(r => {
//         const app = r.json().app_name;
//         document.title = app;
//         webix.storage.cookie.put(COOKIE_APP, app);
//         return r.json();
//       });
//   }
// }

// export function getAppName() {
//   let appName = webix.storage.cookie.get(COOKIE_APP);
//   if (appName === "null" || !appName) {
//     appName = APP_NAME;
//   }
//   document.title = appName;
//   return appName;
// }

export const menuData = [
  { value: "Database", id: routeName.database, icon: "mdi mdi-database" },
  { value: "Query", id: routeName.query, icon: "mdi mdi-play" },
  { value: "Task", id: routeName.task, icon: "mdi mdi-chart-gantt" },
  {
    value: "Compare",
    id: routeName.compare,
    icon: "mdi mdi-swap-horizontal-bold",
  },
  { value: "View Data", id: routeName.viewdata, icon: "mdi mdi-view-grid" },
  { value: "Copy Data", id: routeName.copydata, icon: "mdi mdi-layers" },
  { value: "Generator", id: routeName.generator, icon: "mdi mdi-atom-variant" },
  { value: "Query Share", id: routeName.shared, icon: "mdi mdi-vector-combine" }, // vector-link, vector-intersection
  { value: "Setting", id: routeName.setting, icon: "mdi mdi-cog" },
];
