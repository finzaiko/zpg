import { JetView, plugins } from "webix-jet";
import { API_URL, LAST_SIDEBAR } from "../config/setting";
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
    const _this = this;
    const header = {
      type: "header",
      borderless: true,
      // template: `<span route="/index" class='z_link_btn app_name_link'>${this.app.config.name}</span>`,
      template: `<span class='z_link_btn app_name_link'>${this.app.config.name}</span>`,
      css: "webix_header app_header",
      onClick: {
        app_name_link: function (e, id) {
          webix
            .confirm({
              title: "Confirm Exit",
              ok: "Yes",
              cancel: "No",
              text: "Are you sure to exit current working editor ?",
            })
            .then(function () {
              _this.show("/index");
            });
        },
      },
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
          // https://snippet.webix.com/9f70z3kn
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
                    if ($$("app:sidebar").config.collapsed) {
                      webix.storage.local.put(LAST_SIDEBAR, "1");
                    } else {
                      webix.storage.local.put(LAST_SIDEBAR, "0");
                    }
                  },
                },
                header,
              ],
            },
            // {
            //   view: "button",
            //   type: "icon",
            //   icon: "mdi mdi-menu",
            //   width: 37,
            //   align: "left",
            //   css: "app_button",
            //   click: function() {
            //     $$("app:sidebar").toggle();
            //   }
            // },
            {
              view: "sidebar",
              id: "app:sidebar",
              css: "z_app_sidebar",
              data: menuData,
              width: 180,
              collapsed: true,
              on: {
                onAfterSelect: function (id) {
                  this.$scope.menuClick(this.$scope, id);
                },
                onItemClick: function (id, e, node) {
                  this.$scope.menuClick(this.$scope, id);
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
    const menuState = webix.storage.local.get(LAST_SIDEBAR);
    const st = $$("app:sidebar");
    if (menuState == "1") {
      st.collapse();
    } else {
      st.expand();
    }
    webix.event(window, "keydown", function (e) {
      // webix.message("KeyCode= " + e.keyCode);
      if (e.keyCode == 188 && e.ctrlKey) {
        // webix.message({text:"focust tab check", type: "error"})
        webix.UIManager.setFocus($$("$tabbar1")); //to set focus
        $$("$tabbar1").attachEvent("onEnter", function (ev) {
        });
      }
    });

  }

  menuClick(_scope, id) {
    const item = $$("app:sidebar").getItem(id);
    state.viewScope = _scope;
    if (!$$(item.id)) {
      const view = routes.find((o) => o.id === item.id);
      _scope.addTab({
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
  }
}
