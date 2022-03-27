import { JetView } from "webix-jet";
import GeneratorInsertQueryContent from "./GeneratorInsertQuery";

export default class InsertQuery extends JetView {
  config() {
    return {
      type: "clean",
      borderless: true,
      rows: [GeneratorInsertQueryContent],
    };
  }
}
