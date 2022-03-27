import { JetView, plugins } from "webix-jet";
import { API_URL } from "../config/setting";
import { showError } from "../helpers/ui";
import { menuData, state } from "../models/Base";
import { routeName, routes } from "./routes";
import start from "./start";

function isInt(value) {
  return (
    !isNaN(value) &&
    (function (x) {
      return (x | 0) === x;
    })(parseFloat(value))
  );
}

export default class MainView extends JetView {
  addTab(config) {
    $$("tabs").addView(config);
  }
  config() {
    const header = {
      type: "header",
      borderless: true,
      template: `<span route="/index" class='z_link_btn'>${this.app.config.name}</span>`,
      css: "webix_header app_header",
    };

    const menu = {
      view: "menu",
      id: "top:menu",
      css: "app_menu",
      width: 180,
      layout: "y",
      select: true,
      template: "<span class='webix_icon #icon#'></span> #value# ",
      data: menuData,
      on: {
        onMenuItemClick: function (id) {
          const item = this.getItem(id);
          state.viewScope = this.$scope;
          if (!$$(item.id)) {
            const view = routes.find((o) => o.id === item.id);
            this.$scope.addTab({
              header: item.value,
              id: item.id,
              close: true,
              width: 150,
              body: view,
            });
            $$("tabs").getTabbar().setValue(item.id);
          } else {
            $$("tabs").getTabbar().setValue(item.id);
          }
        },
      },
    };

    const ui = {
      type: "clean",
      css: "app_layout",
      cols: [
        {
          rows: [
            {
              view: "toolbar",
              height: 34,
              css: "zheader",
              elements: [
                {
                  view: "button",
                  type: "icon",
                  icon: "mdi mdi-menu",
                  width: 37,
                  align: "left",
                  css: "app_button",
                  click: function () {
                    $$("app:sidebar").toggle();
                  },
                },
                header,
              ],
            },
            {
              view: "sidebar",
              id: "app:sidebar",
              data: menuData,
              width: 180,
              on: {
                onItemClick: function (id, e, node) {
                  const item = this.getItem(id);
                  state.viewScope = this.$scope;
                  if (!$$(item.id)) {
                    const view = routes.find((o) => o.id === item.id);
                    this.$scope.addTab({
                      header: item.value,
                      css: "z_tabview_item",
                      id: item.id,
                      close: true,
                      width: 150,
                      body: view,
                    });
                    $$("tabs").getTabbar().setValue(item.id);
                  } else {
                    $$("tabs").getTabbar().setValue(item.id);
                  }
                  // webix.message("Selected: "+this.getItem(id).value)
                },
              },
            },
          ],
        },
        {
          padding: {
            left: 4,
          },
          id: "tabs",
          view: "tabview",
          css: "z_app_tabview",
          tooltip: true,
          animate: false,
          cells: [
            {
              header: "Welcome",
              id: "query_welcome",
              css: "z_tabview_item",
              width: 150,
              body: start,
            },
          ],
          tabbar: {
            tooltip: true,
            on: {
              onBeforeTabClose: function (id, e) {
                if (id.includes("query")) {
                  const tval = this.getValue().split("_").pop();
                  let edId = "";
                  if (isInt(tval)) {
                    edId = `${this.getValue()}_sql_editor`;
                  } else {
                    edId = `z_query_sql_editor`;
                  }
                  const a = $$(edId);
                  if (typeof a != "undefined") {
                    if (a.getValue().length > 0) {
                      webix.confirm("Are you sure?").then((result) => {
                        if (result) {
                          $$("tabs").removeView(id);
                        }
                      });
                    } else {
                      $$("tabs").removeView(id);
                    }
                  } else {
                    $$("tabs").removeView(id);
                  }
                } else {
                  $$("tabs").removeView(id);
                }
                return false;
              },
            },
          },
        },
      ],
    };

    webix.ajax(`${API_URL}/app`).then((ra) => {
      const data = ra.json();
      state.appProfile = JSON.parse(data.data.find((m) => m.type == 5).content);
    });

    return ui;
  }

  ready() {
    
  }
}
