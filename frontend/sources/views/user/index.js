import { JetView } from "webix-jet";
import UserPage from './UserPage';

export default class UserIndex extends JetView {
  config() {
    return {
      type: "clean",
      borderless: true,
      rows: [UserPage],
    };
  }
}
