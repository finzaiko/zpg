import { JetView } from "webix-jet";
import { defaultHeader, pagerToolbar } from "../../helpers/ui";
import { DbConfigForm } from "./DbConfigForm";
import { state, url } from '../../models/DbConfig';
import { API_URL } from "../../config/setting";

const prefix = state.prefix;

// VARIABLE BELOW HERE

let toolbar = {
  view: "toolbar",
  css: "z-tb",
  elements: [
    {
      view: "button",
      id: prefix + "_add_btn",
      value: "Add",
      autowidth: true,
      click: function () {
        openForm(this.$scope);
      },
    },
    {
      view: "button",
      id: prefix + "_edit_btn",
      value: "Edit",
      hidden: true,
      autowidth: true,
      click: function () {
        openForm(this.$scope, true);
      },
    },
    {
      view: "button",
      id: prefix + "_delete_btn",
      value: "Delete",
      autowidth: true,
      hidden: true,
      click: function () {
        remove();
      },
    },
    {
      view: "button",
      id: prefix + "_refresh_btn",
      value: "Refresh",
      autowidth: true,
      click: function () {
        reloadDbConfig();
      },
    },
    {},
    // PAGER
    pagerToolbar(prefix+"_pager"),
  ],
};

const grid = {
  view: "datatable",
  id: prefix + "_table",
  columns: [
    {
      id: "conn_name",
      header: "Name",
      width: 150,
    },
    {
      id: "host",
      header: "Host",
      width: 150,
    },
    {
      id: "port",
      header: "Port",
      width: 150,
    },
    {
      id: "database",
      header: "Database",
      width: 150,
    },
    {
      id: "user",
      header: "User",
      width: 150,
    },
  ],
  resizeColumn: true,
  scrollX: true,
  datafetch: 100,
  select: "row",
  pager: prefix+"_pager",
  on: {
    onLoadError: function (text, xml, xhr) {
      showError(xhr);
    },
    onBeforeLoad: function () {
      this.showOverlay("Loading...");
    },
    onAfterLoad: function () {
      this.hideOverlay();
    },
    onItemClick: function(sel) {
				$$(prefix + "_edit_btn").show();
				$$(prefix + "_delete_btn").show();

			const item = this.getItem(sel);
			state.dataSelected = item;
			state.isEdit = true;
		},
		onItemDblClick: function() {
			openForm(this.$scope, true);
		}
  },
  url: `${API_URL}/user_config`
};

// FUNCTION BELOW HERE

function openForm(scope, isEdit = false) {
    state.isEdit = isEdit;
    scope.ui(DbConfigForm).show();
}

export function reloadDbConfig() {
  $$(prefix + "_table").clearAll();
  $$(prefix + "_table").load(`${API_URL}/user_config`);
  defaultBtn();
}

function defaultBtn() {
  $$(prefix + "_edit_btn").hide();
  $$(prefix + "_delete_btn").hide();
}

function remove() {
  const dt = $$(prefix + "_table");
  const item = dt.getItem(dt.getSelectedId()),
    msgName = `${item.conn_name}`;

  webix.confirm({
    ok: "Yes",
    cancel: "No",
    text: "Are you sure to delete: <strong>" + msgName + "</strong> ?",
    callback: function (result) {
      if (result) {
        webix
          .ajax()
          .del(
            `${url}/${item.id}`,
            function (res) {
              webix.message({
                text: "<strong>" + msgName + "</strong> deleted.",
              });
              reloadDbConfig();
            }
          )
          .fail(function (err) {
            showError(err);
          });
      }
    },
  });
}

// CLASS BELOW HERE

export default class DbConfigPage extends JetView {
  config() {
    return {
      type: "clean",
      rows: [toolbar, grid],
    };
  }
  init(view) {}
  destructor() {}
}
