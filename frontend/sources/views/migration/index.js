import { JetView } from "webix-jet";
import MigrationPage from "./MigrationPage";

export default class MigrationIndex extends JetView {
  config() {
    return {
      type: "clean",
      borderless: true,
      rows: [MigrationPage],
    };
  }
}
