import { JetView } from "webix-jet";
import SettingPage from './SettingPage';

export default class SettingIndex extends JetView {
  config() {
    return {
      type: "clean",
      borderless: true,
      rows: [SettingPage],
    };
  }
}
