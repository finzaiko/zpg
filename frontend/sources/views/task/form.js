import { JetView } from "webix-jet";
import TaskForm from './TaskForm';

export default class TaskFormIndex extends JetView {
  config() {
    return {
      type: "clean",
      borderless: true,
      rows: [TaskForm],
    };
  }
}
