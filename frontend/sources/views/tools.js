import { JetView, plugins } from "webix-jet";
import { menuData } from "../models/Base";
import { routeName } from "./routes";

export default class TopView extends JetView {
  config() {
    return {
      css: "z_layout_p",
      // type: "wide",
      padding: {
        left: 4,
      },
      rows: [{ $subview: true }],
    };
  }

  init() {}

  urlChange(view, url) {}
}
