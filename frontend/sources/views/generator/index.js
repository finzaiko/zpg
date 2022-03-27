import { JetView } from "webix-jet";
import GeneratorPage from './GeneratorPage';

export default class GeneratorIndex extends JetView {
  config() {
    return {
      type: "clean",
      borderless: true,
      rows: [ GeneratorPage],
    };
  }
}
