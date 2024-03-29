import { JetView } from "webix-jet";
import {
  administrationMenuList,
  runView,
  state,
} from "../../models/Administration";
import { url as urlProfile } from "../../models/Profile";
import {
  autoExpandColumnSize,
  showLoadingText,
  toTitleCase,
} from "../../helpers/ui";
import { LAST_DB_CONN_ADMIN } from "../../config/setting";

const prefix = state.prefix;

const toolbar = {
  view: "toolbar",
  css: "z_grey_tb",
  elements: [
    {
      view: "combo",
      id: prefix + "_server",
      placeholder: "Source server",
      options: {
        url: `${urlProfile}/conn?type=1&ls=true`,
        fitMaster: false,
        width: 200,
      },
      on: {
        onChange: function (newv, oldv) {
          if (newv) {
            webix.storage.local.put(LAST_DB_CONN_ADMIN, newv);
            if ($$(prefix + "_reload_conf_btn")) {
              $$(prefix + "_reload_conf_btn").enable();
            }
          }
        },
      },
    },
  ],
};

function runAction() {
  const serverSource = $$(prefix + "_server").getValue();
  if (!serverSource) {
    webix.message({ text: "Please choose source server", type: "error" });
    return;
  }
  const inputData = {
    source_id: serverSource,
    action: state.dataSelected.action,
  };

  const panelId = $$(prefix + "_mainview");
  showLoadingText(panelId);

  runView(inputData).then((r) => {
    let views = $$(prefix + "_scrollview_body").getChildViews();
    if (views[0]) {
      $$(prefix + "_scrollview_body").removeView(views[0]);
    }

    if (r.data.length > 0) {
      const cols = Object.keys(r.data[0]);

      let colConfig = [];

      cols.forEach((o) => {
        colConfig.push({
          id: o,
          header: [
            toTitleCase(o.replace(/_/g, " ")),
            { content: "textFilter" },
          ],
          width: 100,
          sort: "String",
          editor: "text",
        });
      });

      const newView = {
        view: "datatable",
        resizeColumn: true,
        id: prefix + "_table_viewer",
        data: r.data,
        select: "row",
        columns: colConfig,
        editable: true,
        editaction: "dblclick",
      };

      $$(prefix + "_result_scrollview").show();
      $$(prefix + "_scrollview_body").addView(newView);
      setTimeout(() => {
        autoExpandColumnSize($$(prefix + "_table_viewer"));
      }, 300);
    } else {
      const newView = {
        template: "No data",
      };
      $$(prefix + "_result_scrollview").show();
      $$(prefix + "_scrollview_body").addView(newView);
    }
    panelId.hideOverlay();
  });
}

export default class AdministrationPage extends JetView {
  config() {
    return {
      id: "z_administration_page",
      rows: [
        {
          cols: [
            {
              rows: [
                toolbar,
                {
                  view: "list",
                  width: 250,
                  template: "#title#",
                  select: true,
                  css: "z_generator_list",
                  tooltip: function (obj) {
                    return "" + obj.detail;
                  },
                  data: administrationMenuList,
                  on: {
                    onItemClick: function (sel) {
                      const item = this.getItem(sel);
                      state.dataSelected = item;
                      this.$scope.show(`${item.url}?action=${item.action}`, {
                        target: prefix + "_pageview",
                      });
                      runAction();
                    },
                  },
                },
              ],
            },
            {
              id: prefix + "_mainview",
              rows: [{ $subview: true, name: prefix + "_pageview" }],
            },
          ],
        },
      ],
    };
  }
  init() {
    this.show("administration.default", { target: prefix + "_pageview" });
  }
  ready() {
    const db = webix.storage.local.get(LAST_DB_CONN_ADMIN);
    if (db) {
      $$(prefix + "_server").setValue(db);
    }
  }
}
