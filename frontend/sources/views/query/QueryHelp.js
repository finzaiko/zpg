import { JetView } from "webix-jet";
import { state } from "../../models/Query";

const prefix = state.prefix + "_help";

const data = [
  { id:1, key: "<span class='btn_template'>Ctrl</span> <span class='btn_template'>;&nbsp;</span>", shortcut: "Focus to quick search"},
  { id:2, key: "<span class='btn_template'>Ctrl</span> <span class='btn_template'>F</span>", shortcut: "Find"},
  { id:3, key: "<span class='btn_template'>Ctrl</span> <span class='btn_template'>H</span>", shortcut: "Find and Replace"},
  { id:4, key: "<span class='btn_template'>Ctrl</span> <span class='btn_template'>E</span>", shortcut: "Delete line"},
];

const WindowForm = () => {
  const winId = prefix + "_win";

  const grid = {
    view: "datatable",
    id: prefix + "_table",
    resizeColumn: true,
    select: "row",
    height: 400,
    width: 300,
    columns: [
      {
        header: [],
        id: "key",
        adjust: true,
      },
      {
        header: [],
        id: "shortcut",
        width: 500,
      },
    ],
    on: {
      onBeforeLoad: function () {
        this.showOverlay("Loading...");
      },
      onAfterLoad: function () {
        this.hideOverlay();
      },
    },
    data: data
  };

  return {
    view: "window",
    modal: true,
    id: winId,
    position: "center",
    move: true,
    head: {
      height: 38,
      cols: [
        {width: 30},
        {view: "label", label: "Shortcut",  align:"center"},
        {
					view: "icon",
					icon: "mdi mdi-window-close",
					css: "win_btn",
					click: function () {
						$$(winId).destructor();
					},
				},
      ]
      
    },
    body: {
      rows: [grid],
    },
  };
};

const close = () => {
  $$(prefix + "_win").destructor();
};

export class QueryHelp extends JetView {
  config() {
    return WindowForm();
  }
  show(target) {
    this.getRoot().show(target);
  }
}
