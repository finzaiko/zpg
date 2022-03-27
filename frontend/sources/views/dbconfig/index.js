import { JetView } from "webix-jet";
import DbConfigPage from './DbConfigPage';

export default class DbConfigIndex extends JetView {
  config() {
    return {
      type: "clean",
      borderless: true,
      rows: [ DbConfigPage],
    };
  }
}
