
import { routeName } from "../views/routes";

export let state = {
  viewScope: {},
  currentTabQuery: 0,
  currentTabViewData: 0,
  currentDBSelected: "",
  meta: {},
  appProfile: {},
};

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
  { value: "Setting", id: routeName.setting, icon: "mdi mdi-cog" },
];
