import { JetView } from "webix-jet";

export default class GeneratorDefault extends JetView {
  config() {
    return {
      template: `<div style='background:white;padding-top:0;height:99%; display: flex;justify-content: center;align-items: center; flex-direction: column;margin-top:1px; margin-bottom:1px'>
        <div>Select left list generator</div>
        <div style='font-size: 20px' class='mdi mdi-arrow-left'></div>
      </div>`
    };
  }
}
