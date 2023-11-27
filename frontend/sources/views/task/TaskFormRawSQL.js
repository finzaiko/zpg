import { JetView } from "webix-jet";
import { state, urlItem } from "../../models/Task";
import { reloadTaskItem } from "./TaskForm";

const prefix = state.prefix + "_rawform";
const prefixPage = state.prefix;

const WindowForm = () => {
  const winId = prefix + "_win";

  return {
    view: "window",
    modal: true,
    resize: true,
    id: winId,
    position: "center",
    move: true,
    width: 700,
    height: 550,
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
          tooltip: "Save raw query",
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
          view: "text",
          id: prefix + "_raw_title",
          placeholder: "Title..",
        },
        {
          view: "monaco-editor",
          id: prefix + "_raw_sql_editor",
        },
      ],
    },
  };
};

function saveItemRawSQL() {
  const rawTitle = $$(prefix + "_raw_title").getValue();
  const sqlRaw = $$(prefix + "_raw_sql_editor").getValue();
  const itemCount = $$(prefixPage + "_form_selected_table").count();
  const taskId = state.dataSelected.id;
  const data = {
    task_id: taskId,
    schema: "",
    type: 9,
    seq: parseInt(itemCount) * -1,
    func_name: rawTitle,
    sql_content: sqlRaw,
    oid: 0,
  };
  if (!state.isEditItem) {
    webix
      .ajax()
      .post(urlItem, data, function (res) {
        reloadTaskItem($$(prefixPage + "_form_selected_table"), taskId);
        webix.message({ text: "Raw SQL saved", type: "success" });
        $$(prefix + "_win").destructor();
      })
      .fail(function (err) {
        showError(err);
      });
  } else {
    const selId = state.dataSelectedItem.id;
    webix
      .ajax()
      .put(`${urlItem}/${selId}`, data, function (res) {
        reloadTaskItem($$(prefixPage + "_form_selected_table"), taskId);
        webix.message({ text: "Raw SQL updated", type: "success" });
        $$(prefix + "_win").destructor();
      })
      .fail(function (err) {
        showError(err);
      });
  }
}

export class TaskFormRawSQL extends JetView {
  config() {
    return WindowForm();
  }
  show(target) {
    this.getRoot().show(target);
  }
  ready() {
    if (state.isEditItem) {
      const { name, sql_content } = state.dataSelectedItem;
      $$(prefix + "_raw_title").setValue(name);
      $$(prefix + "_raw_sql_editor").setValue(sql_content);
    } else {
      $$(prefix + "_raw_title").setValue();
      $$(prefix + "_raw_sql_editor").setValue();
    }
  }
}
