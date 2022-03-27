import { JetView } from "webix-jet";
import GeneratorOutParamsContent from './GeneratorOutParams';

export default class GeneratorOutParams extends JetView {
  config() {
    return {
      type: "clean",
      borderless: true,
      rows: [ GeneratorOutParamsContent],
    };
  }
}
