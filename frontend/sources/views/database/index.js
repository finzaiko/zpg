import { JetView } from "webix-jet";
import DatabasePage from './DatabasePage';

export default class DatabaseIndex extends JetView {
  config() {
    return {
      type: "clean",
      borderless: true,
      rows: [DatabasePage],
    };
  }
}
