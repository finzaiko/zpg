import { JetView } from "webix-jet";
import SharePage  from "./SharePage";

export default class ShareIndex extends JetView {
  config() {
    return {
      type: "clean",
      borderless: true,
      rows: [SharePage],
    };
  }
}
