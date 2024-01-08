import { JetView } from "webix-jet";
import { state } from "../../models/Compare";

const prefix = state.prefix + "_help";

const WindowForm = () => {
  const winId = prefix + "_win";

  return {
    view: "window",
    modal: true,
    id: winId,
    position: "center",
    move: true,
    head: {
      height: 38,
      cols: [
        { width: 30 },
        { view: "label", label: "Help", align: "center" },
        {
          view: "icon",
          icon: "mdi mdi-window-close",
          css: "win_btn",
          click: function () {
            $$(winId).destructor();
          },
        },
      ],
    },
    body: {
      rows: [
        {
          template: `
          <p>
            <ul style='margin: 0;padding: 0; list-style-type: none;'>
              <li><span class='z-cell-src' style='padding: 2px'>src</span> = Source not found</li>
              <li><span class='z-cell-trg' style='padding: 2px'>trg</span> = Target not found</li>
              <li><span class='z-cell-diff' style='padding: 2px'>dif</span> = Source and Target are different</li>
            </ul>
          </p>
        `,
        },
      ],
    },
  };
};

export class CompareHelp extends JetView {
  config() {
    return WindowForm();
  }
  show(target) {
    this.getRoot().show(target);
  }
}
