import { JetView, plugins } from "webix-jet";
import { API_URL, BUILD_MODE, LAST_SIDEBAR } from "../config/setting";
import { isInt, showError } from "../helpers/ui";
import { menuData, state } from "../models/Base";
import { routeName, routes } from "./routes";
import start from "./about";
import { deleteStoreIDB, emptyStoreIDB, readStoreIDB } from "../helpers/idb";
import { QueryPage } from "./query/QueryPage";
import { state as stateQuery } from "../models/Query";
// import start from "./start";

window.getTabId = function (context) {
  const attr = context.target.getAttribute("button_id");
  const tab = attr ? attr : context.target.parentNode.getAttribute("button_id");
  return tab;
};

function loadAppSetting() {
  const st = $$("app:sidebar");
  webix.extend(st, webix.OverlayBox);
  st.showOverlay("<div style='margin-top: 20px'>Loading...</div>");
  webix.ajax(`${API_URL}/app`, function (res) {
    const rData = JSON.parse(res);
    state.appProfile = rData.data;
    const b = state.appProfile.find((o) => o.key == "is_admin_menu").value;
    if (b == "1") {
      st.parse(menuDataFiltered);
    } else {
      const f = menuDataFiltered.filter((o) => o.id !== "administration");
      st.parse(f);
    }
    st.hideOverlay();
  });
}

function openWelcomeTab() {
  const tabview = $$("tabs");
  const tabs = tabview.getMultiview().getChildViews();
  if (tabs.length == 0) {
    tabview.addView({
      header: "Welcome",
      id: "query_welcome",
      css: "z_tabview_item",
      width: 150,
      body: start,
    });
  }
}

function restoreLastQuery(scope) {
  readStoreIDB().then((r) => {
    const tabs = r.items;
    if (tabs.length > 0) {
      let idx = [];
      tabs.forEach((item) => {
        const s = item.tab.split("_").pop();
        let j = 0;
        if (isInt(s)) {
          j = parseInt(s);
        }
        idx.push(j);
        let newViewId = j != 0 ? j : "";

        state.currentTabQuery = j;

        state.viewScope.addTab({
          header: "Query " + newViewId,
          id: item.tab,
          close: true,
          width: 150,
          body: QueryPage(item.tab, item.source_id, item.value),
        });
      });
      const minTab = Math.min(...idx);
      const maxTab = Math.max(...idx);
      state.currentTabQuery = maxTab;

      $$("tabs").getTabbar().setValue(minTab);
    }
  });
}

function getTabbarList(tabId) {
  return tabId.getTabbar().data.options;
}

function initContextMenu() {
  webix
    .ui({
      view: "contextmenu",
      id: "tabscmenu",
      data: [
        { id: 1, value: "Close Other Query Tabs" },
        { id: 2, value: "Close Query Tabs to Right" },
        { $template: "Separator" },
        { id: 3, value: "Close All Query Tabs" },
      ],
      submenuConfig: {
        width: 180,
      },
      on: {
        onBeforeShow: function () {
          const tabId = getTabId(this.getContext());
          const tabList = getTabbarList($$("tabs"));
          const currentIndex = tabList.findIndex((o) => o.id == tabId);
          if (tabList.length == 1) {
            this.disableItem(1);
          } else {
            this.enableItem(1);
          }
          if (currentIndex == tabList.length - 1) {
            this.disableItem(2);
          } else {
            this.enableItem(2);
          }
        },
        onMenuItemClick: function (id, event, itemNode) {
          const tabId = $$("tabs");
          const tabList = getTabbarList(tabId);
          const tabIdText = getTabId(this.getContext());
          if (id == 1) {
            const closeTabList = tabList.filter((o) => o.id !== tabIdText);
            const promises = [];
            closeTabList.forEach((ol) => {
              promises.push(
                new Promise((resolve, reject) => {
                  setTimeout(() => {
                    tabId.removeView(ol.id);
                    onCloseTab(ol.id);
                    resolve();
                  }, 100);
                })
              );
            });
            Promise.all(promises).then(() => {});
          } else if (id == 2) {
            const currentIndex = tabList.findIndex((o) => o.id == tabIdText);
            const rightTabList = tabList.filter((_, i) => i > currentIndex);
            const promises = [];
            rightTabList.forEach((ol) => {
              promises.push(
                new Promise((resolve, reject) => {
                  setTimeout(() => {
                    tabId.removeView(ol.id);
                    onCloseTab(ol.id);
                    resolve();
                  }, 100);
                })
              );
            });
            Promise.all(promises).then(() => {});
          } else if (id == 3) {
            const promises = [];
            tabList.forEach((o) => {
              promises.push(
                new Promise((resolve, reject) => {
                  setTimeout(() => {
                    tabId.removeView(o.id);
                    resolve();
                  }, 100);
                })
              );
            });
            Promise.all(promises).then(() => {
              emptyStoreIDB();
              state.currentTabQuery = 0;
              openWelcomeTab();
            });
          }
        },
      },
    })
    .attachTo($$("tabs").getTabbar().$view);
}

function onCloseTab(tabId) {
  deleteStoreIDB(tabId);
}

let menuDataFiltered =
  BUILD_MODE == "desktop"
    ? menuData.filter((e) => e.id !== "shared")
    : menuData;

export default class MainView extends JetView {
  addTab(config) {
    $$("tabs").addView(config);
  }
  config() {
    const _this = this;
    // let menuDataFiltered =
    //   BUILD_MODE == "desktop"
    //     ? menuData.filter((e) => e.id !== "shared")
    //     : menuData;
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
      // data: menuDataFiltered,
      data: menuDataFiltered,
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
            {
              view: "sidebar",
              id: "app:sidebar",
              css: "z_app_sidebar",
              data: [],
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
                          onCloseTab(id);
                        }
                      });
                    } else {
                      $$("tabs").removeView(id);
                      onCloseTab(id);
                    }
                  } else {
                    $$("tabs").removeView(id);
                    onCloseTab(id);
                  }
                } else {
                  $$("tabs").removeView(id);
                  onCloseTab(id);
                }

                openWelcomeTab();
                return false;
              },
              onChange: function (newv, oldv, cfg) {
                let tabview = $$("tabs");
                let tabs = tabview.getMultiview().getChildViews();
                if (tabs.length > 1) {
                  tabview.removeView("about_tab" || "start_tab");
                }
              },
            },
          },
        },
      ],
    };

    return ui;
  }

  ready() {
    state.viewScope = this;
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
        $$("$tabbar1").attachEvent("onEnter", function (ev) {});
      }
    });

    loadAppSetting();

    initContextMenu();

    restoreLastQuery(this);
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
