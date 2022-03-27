import { JetView } from "webix-jet";
import { state as stateQuery } from "../../models/Query";
import { QueryPage } from "./QueryPage";


export default class QueryIndex extends JetView {
  config() {
    return QueryPage(stateQuery.prefix);
  }
}
