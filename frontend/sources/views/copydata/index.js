import { JetView } from "webix-jet";
import CopyDataPage from "./CopyDataPage";

export default class CopyDataIndex extends JetView {
  config() {
    return {
      type: "clean",
      borderless: true,
      rows: [CopyDataPage],
    };
  }
}
