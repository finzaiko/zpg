import { JetView } from "webix-jet";
import { state as stateViewData } from "../../models/ViewData";
import { ViewDataPage } from "./ViewDataPage";


export default class ViewDataIndex extends JetView {
  config() {
    return ViewDataPage(stateViewData.prefix);
  }
}
