import CompareIndex from "./compare/index";
import DatabaseIndex from "./database/index";
import CopyDataIndex from "./copydata/index";
import TaskIndex from "./task/index";
import GeneratorIndex from './generator/index';
import SettingIndex from "./setting/index";
import { QueryPage } from "./query/QueryPage";
import { state as stateQuery } from "../models/Query";
import { state as stateViewData } from "../models/ViewData";
import { ViewDataPage } from './viewdata/ViewDataPage';
import ShareIndex from "./share";
import AdministrationIndex from "./administration";

export const routeName = {
  task: "task",
  database: "database",
  query: "query",
  migration: "migration",
  compare: "compare",
  viewdata: "viewdata",
  copydata: "copydata",
  generator: "generator",
  shared: "shared",
  setting: "setting",
  administration: "administration",
};

export const routes = [
  {
    id: routeName.task,
    type: "clean",
    borderless: true,
    rows: [TaskIndex],
  },
  {
    id: routeName.database,
    type: "clean",
    borderless: true,
    rows: [DatabaseIndex],
  },
  {
    id: routeName.query,
    type: "clean",
    borderless: true,
    rows: [QueryPage(stateQuery.prefix)],
  },
  {
    id: routeName.compare,
    type: "clean",
    borderless: true,
    rows: [CompareIndex],
  },
  {
    id: routeName.copydata,
    type: "clean",
    borderless: true,
    rows: [CopyDataIndex],
  },
  {
    id: routeName.viewdata,
    type: "clean",
    borderless: true,
    rows: [ViewDataPage(stateViewData.prefix)],
  },
  {
    id: routeName.setting,
    type: "clean",
    borderless: true,
    rows: [SettingIndex],
  },
  {
    id: routeName.generator,
    type: "clean",
    borderless: true,
    rows: [GeneratorIndex],
  },
  {
    id: routeName.shared,
    type: "clean",
    borderless: true,
    rows: [ShareIndex],
  },
  {
    id: routeName.administration,
    type: "clean",
    borderless: true,
    rows: [AdministrationIndex],
  },
];
