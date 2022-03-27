import { JetView } from "webix-jet";
import ComparePage from './ComparePage';

export default class CompareIndex extends JetView {
  config() {
    return {
      type: "clean",
      borderless: true,
      rows: [ComparePage],
    };
  }
}
