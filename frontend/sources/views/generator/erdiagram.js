import { JetView } from "webix-jet";
import GeneratorOutParamsContent from "./GeneratorOutParams";

export default class GeneratorERDiagram extends JetView {
  config() {
    return {
      type: "clean",
      // borderless: true,
      rows: [
        {
          type: "padding",
          template: "Not implement yet",
        },
      ],
    };
  }
}
