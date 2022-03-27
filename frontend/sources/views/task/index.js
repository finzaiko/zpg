import { JetView } from "webix-jet";
import TaskPage from "./TaskPage";

export default class TaskIndex extends JetView {
  config() {
    return {
      type: "clean",
      borderless: true,
      rows: [{ $subview: true, name: "z_task_page" }],
    };
  }

  init() {
    this.show("task.page", { target: "z_task_page" });
  }
}
