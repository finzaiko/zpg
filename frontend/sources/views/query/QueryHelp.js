import { JetView } from "webix-jet";
import { state } from "../../models/Query";

const prefix = state.prefix + "_help";

const data = [
  // { id:1, key: "<span class='btn_template'>Ctrl</span> <span class='btn_template'>P</span>", shortcut: "Go to quick search when current focus on Query Editor"},
  { id:1, key: "<span class='btn_template'>Ctrl</span> <span class='btn_template'>;&nbsp;</span>", shortcut: "Focus to quick search"},
  { id:2, key: "<span class='btn_template'>Ctrl</span> <span class='btn_template'>M</span>", shortcut: "Open new Query"},
  { id:3, key: "<span class='btn_template'>Ctrl</span> <span class='btn_template'>F</span>", shortcut: "Find"},
  { id:4, key: "<span class='btn_template'>Ctrl</span> <span class='btn_template'>H</span>", shortcut: "Find and Replace"},
  { id:5, key: "<span class='btn_template'>Ctrl</span> <span class='btn_template'>C</span>", shortcut: "Duplicate current line (without block)"},
  { id:6, key: "<span class='btn_template'>Ctrl</span> <span class='btn_template'>/</span>", shortcut: "Toggle comment/uncomment"},
  { id:7, key: "<span class='btn_template'>Ctrl</span> <span class='btn_template'>Shift</span>  <span class='btn_template'>A</span>", shortcut: "Toggle block/unblock comment"},
  { id:8, key: "<span class='btn_template'>Ctrl</span> <span class='btn_template'>Shift</span>  <span class='btn_template'>K</span>", shortcut: "Delete line"},
  { id:9, key: "<span class='btn_template'>Alt</span> <span class='btn_template'> <i class='mdi mdi-arrow-up'></i> or <i class='mdi mdi-arrow-down'></i> </span>", shortcut: "Move line up or down"},
  { id:10, key: "<span class='btn_template'>Shift</span> <span class='btn_template'>Alt</span> <span class='btn_template'> <i class='mdi mdi-arrow-up'></i> or <i class='mdi mdi-arrow-down'></i> </span>", shortcut: "Edit multiline"},
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
