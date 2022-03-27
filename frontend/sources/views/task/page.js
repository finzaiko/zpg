import { JetView } from "webix-jet";
import TaskPage from "./TaskPage";

export default class TaskPageIndex extends JetView {
  config() {
    return {
      type: "clean",
      borderless: true,
      rows: [TaskPage],
    };
  }
}
