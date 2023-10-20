import { JetView } from "webix-jet";
import { state } from "../../models/Query";
import { urlItem } from "../../models/Task";

const prefix = state.prefix + "_help";

const WindowForm = () => {
  const winId = prefix + "_win";

  return {
    view: "window",
    modal: true,
    resize: true,
    id: winId,
    position: "center",
    move: true,
    width: 600,
    height: 500,
    position: "center",
    move: true,
    head: {
      // height: 38,
      cols: [
        { width: 20 },
        { view: "label", label: "Raw SQL", align: "left", width: 60 },
        {
          view: "button",
          type: "icon",
          icon: "mdi mdi-content-save-outline",
          css: "zmdi_padding",
          id: prefix + "_save_raw_item_btn",
          tooltip: "Save Task",
          autowidth: true,
          click: function () {
            saveItemRawSQL();
          },
        },
        {},
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
          view: "monaco-editor",
          id: prefix + "_raw_sql_editor",
        },
      ],
    },
  };
};

function saveItemRawSQL() {
  const sqlRaw = $$(prefix + "_raw_sql_editor").getValue();
  const taskItemId= $$(prefix + "_task_id").getValue();

}


const close = () => {
  $$(prefix + "_win").destructor();
};

export class TaskFormRawSQL extends JetView {
  config() {
    return WindowForm();
  }
  show(target) {
    this.getRoot().show(target);
  }
}
