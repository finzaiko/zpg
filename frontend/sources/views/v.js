import { JetView, plugins } from "webix-jet";
import {
  API_URL,
  BUILD_MODE,
  LAST_QUERY_RESTORE,
  LAST_SIDEBAR,
} from "../config/setting";
import { isInt, showError } from "../helpers/ui";
import { menuData, state } from "../models/Base";
import { routeName, routes } from "./routes";
import start from "./about";
import {
  deleteStoreIDB,
  emptyStoreIDB,
  readStoreIDB,
  reorderStoreIDB,
  upsertStoreIDB,
} from "../helpers/idb";
import { QueryPage } from "./query/QueryPage";
import { snippetStore, state as stateQuery } from "../models/Query";
import SreensaverView from "./screensaver";
// import start from "./start";


const TAB_COLORS = {
  blue: "#4285F4",
  red: "#EE675C",
  yellow: "#ffb638",
  green: "#34A853",
  pink: "#E52592",
  purple: "#AF5CF7",
  cyan: "#129EAF",
  orange: "#FB8C00",
};

const BASE_TAB_ITEMS = [
        { id: 1, value: "Close Other Query Tabs" },
        { id: 2, value: "Close Query Tabs to Right" },
        { $template: "Separator" },
        { id: 3, value: "Close All Query Tabs" },];

const TAB_COLOR_CLASS_PREFIX = "z_tab_color_";
const TAB_COLOR_MENU_ID = 0;
const TAB_COLOR_MENU_ITEM = {
  id: TAB_COLOR_MENU_ID,
  value: "Tab Color",
  data: [
    { id: "none", value: "<span>No Color</span>" },
    {
      id: "blue",
      value: "<i class='z_boxradius_color z_boxradius_color_blue'></i><span>Blue</span>",
    },
    {
      id: "red",
      value: "<i class='z_boxradius_color z_boxradius_color_red'></i><span>Red</span>",
    },
    {
      id: "yellow",
      value: "<i class='z_boxradius_color z_boxradius_color_yellow'></i><span>Yellow</span>",
    },
    {
      id: "green",
      value: "<i class='z_boxradius_color z_boxradius_color_green'></i><span>Green</span>",
    },
    {
      id: "pink",
      value: "<i class='z_boxradius_color z_boxradius_color_pink'></i><span >Pink</span>",
    },
    {
      id: "purple",
      value: "<i class='z_boxradius_color z_boxradius_color_purple'></i><span >Purple</span>",
    },
    {
      id: "cyan",
      value: "<i class='z_boxradius_color z_boxradius_color_cyan'></i><span >Cyan</span>",
    },
    {
      id: "orange",
      value: "<i class='z_boxradius_color z_boxradius_color_orange'></i><span>Orange</span>",
    },
  ],
};

function normalizeQueryTabKey(tabId) {
  return tabId === "query" ? "z_query" : tabId;
}

function stripTabColorClass(cssText) {
  if (!cssText) return "";
  return String(cssText)
    .split(/\s+/)
    .filter((cls) => !!cls && !cls.startsWith(TAB_COLOR_CLASS_PREFIX))
    .join(" ");
}

function composeTabCss(existingCss, colorId) {
  const baseCss = stripTabColorClass(existingCss);
  if (!colorId || !TAB_COLORS[colorId]) {
    return baseCss;
  }
  return `${baseCss} ${TAB_COLOR_CLASS_PREFIX}${colorId}`.trim();
}

function applyTabColor(tabbar, tabId, colorId, shouldPersist) {
  const isResetColor = colorId === null || colorId === "none";
  if (!isResetColor && !TAB_COLORS[colorId]) {
    return;
  }

  const options = (tabbar.config.options || []).slice();
  const targetIndex = options.findIndex((o) => String(o.id) === String(tabId));
  if (targetIndex < 0) {
    return;
  }

  const item = Object.assign({}, options[targetIndex]);
  item.tabColor = isResetColor ? null : colorId;
  item.css = composeTabCss(item.css, item.tabColor);
  options[targetIndex] = item;

  tabbar.define("options", options);
  tabbar.refresh();

  if (shouldPersist) {
    const key = normalizeQueryTabKey(tabId);
    const hasEditor = !!$$(`${tabId}_sql_editor`) || !!$$(`${key}_sql_editor`);
    if (hasEditor) {
      upsertStoreIDB({ tabColor: item.tabColor }, key);
    }
  }
}

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

function setDisableHistoryBrowser() {
  setTimeout(() => {
    if (window.location.href.endsWith('/#!/v')) {
      // Disable back and forward buttons
      history.pushState(null, null, location.href);
      history.back();
      history.forward();
      window.onpopstate = function ()
      {
          history.go(1);
      };

      // history.pushState(null, null, window.location.href);
      // history.back();
      // window.onpopstate = () => history.forward();

      // Prevent back and forward navigation
      history.replaceState(null, '', window.location.href);
      window.addEventListener('popstate', function(e) {
          e.preventDefault();
          history.replaceState(null, '', window.location.href);
      });
    }

  }, 1000);
}

function loadSnippet() {
  webix.ajax(`${API_URL}/snippet`, (res) => {
    snippetStore.add({ data: JSON.parse(res).data });
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

function resetLastIndexQueryTab() {
  setTimeout(() => {
    const allTabList = getTabbarList($$("tabs"));
    const tabList = allTabList.filter((o) => o.id.includes("query"));

    if (tabList.length > 0) {
      let idx = [];
      tabList.forEach((item) => {
        const s = item.id.split("_").pop();
        let j = 0;
        if (isInt(s)) {
          j = parseInt(s);
        }
        idx.push(j);
      });
      state.currentTabQuery = Math.max(...idx);
    }
  }, 100);
}

function restoreLastQuery(scope) {
  if (!!stateQuery.isRestoreLastQuery) {
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
            css: composeTabCss("z_tabview_item", item.tabColor),
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
}

function getTabbarList(tabId) {
  return tabId.getTabbar().data.options;
}

function syncCloseTabs(list, isCloseInLoop, afterAction) {
  const promises = [];
  list.forEach((ol) => {
    promises.push(
      new Promise((resolve, reject) => {
        setTimeout(() => {
          $$("tabs").removeView(ol.id);
          if (isCloseInLoop) {
            onCloseTab(ol.id);
          }
          resolve();
        }, 100);
      })
    );
  });
  Promise.all(promises).then(() => {
    afterAction();
  });
}

function initContextMenu() {
  webix
    .ui({
      view: "contextmenu",
      id: "tabscmenu",
      data: [
      ],
      submenuConfig: {
        width: 180,
      },
      on: {
                onBeforeShow: function () {
          this.clearAll();
          const tabId = getTabId(this.getContext());
          const allTabList = getTabbarList($$("tabs"));
          const queryTabList = allTabList.filter((o) => o.id.includes("query"));
          const isQueryTab = tabId && tabId.includes("query");
          if (isQueryTab) {
            this.parse(BASE_TAB_ITEMS);
              this.add(webix.copy(TAB_COLOR_MENU_ITEM), 0);
          }
          const currentIndex = queryTabList.findIndex((o) => o.id == tabId);
          if (queryTabList.length == 1 || currentIndex < 0) {
            this.disableItem(1);
            this.disableItem(2);
          } else {
            this.enableItem(1);
            if (currentIndex == queryTabList.length - 1) {
              this.disableItem(2);
            } else {
              this.enableItem(2);
            }
          }
        },
        onMenuItemClick: function (id, event, itemNode) {
            const tabId = $$("tabs");
            const allTabList = getTabbarList(tabId);
            const queryTabList = allTabList.filter((o) => o.id.includes("query"));
            const tabIdText = getTabId(this.getContext());
            if (id === "none") {
              applyTabColor(tabId.getTabbar(), tabIdText, null, true);
            } else if (TAB_COLORS[id]) {
              applyTabColor(tabId.getTabbar(), tabIdText, id, true);
            } else if (id == 1) {
              const closeTabList = queryTabList.filter((o) => o.id !== tabIdText);
              syncCloseTabs(closeTabList, true, () => {
                resetLastIndexQueryTab();
              });
            } else if (id == 2) {
              const currentIndex = queryTabList.findIndex(
                (o) => o.id == tabIdText
              );
              const rightTabList = queryTabList.filter(
                (_, i) => i > currentIndex
              );
              syncCloseTabs(rightTabList, true, () => {
                resetLastIndexQueryTab();
              });
            } else if (id == 3) {
              syncCloseTabs(queryTabList, false, () => {
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

 function enableTabDragging(tabbar) {
    var containerNode = tabbar.$view;
    var tabNodes = containerNode.querySelectorAll(".webix_item_tab");
    var options = tabbar.config.options || [];

    tabNodes.forEach(function (tabNode, index) {
      var option = options[index];
      if (!option) return;

      // simpan id tab di data-attribute, jangan andalkan atribut
      // internal webix yang tidak didokumentasikan
      tabNode.setAttribute("data-tab-id", option.id);
      tabNode.setAttribute("draggable", "true");

      tabNode.addEventListener("dragstart", function (ev) {
        ev.dataTransfer.effectAllowed = "move";
        ev.dataTransfer.setData("text/plain", String(option.id));
        tabNode.classList.add("tab-dragging");
      });

      tabNode.addEventListener("dragend", function () {
        tabNode.classList.remove("tab-dragging");
        tabNodes.forEach(function (t) {
          t.classList.remove("tab-drag-over");
        });
      });

      tabNode.addEventListener("dragover", function (ev) {
        ev.preventDefault();
        ev.dataTransfer.dropEffect = "move";
        tabNode.classList.add("tab-drag-over");
      });

      tabNode.addEventListener("dragleave", function () {
        tabNode.classList.remove("tab-drag-over");
      });

      tabNode.addEventListener("drop", function (ev) {
        ev.preventDefault();
        tabNode.classList.remove("tab-drag-over");

        var draggedId = ev.dataTransfer.getData("text/plain");
        var targetId = tabNode.getAttribute("data-tab-id");

        if (draggedId && targetId && draggedId !== targetId) {
          reorderTabs(tabbar, draggedId, targetId);
        }
      });
    });
  }

  function reorderTabs(tabbar, draggedId, targetId) {
    var options = tabbar.config.options.slice();

    var fromIndex = options.findIndex(function (o) {
      return String(o.id) === String(draggedId);
    });
    var toIndex = options.findIndex(function (o) {
      return String(o.id) === String(targetId);
    });

    if (fromIndex === -1 || toIndex === -1) return;

    var moved = options.splice(fromIndex, 1)[0];
    // Adjust insertion index: if dragging from left to right, the indices shift
    var insertIndex = toIndex > fromIndex ? toIndex - 1 : toIndex;
    options.splice(insertIndex, 0, moved);

    // definisikan ulang urutan tab, lalu refresh tampilannya
    tabbar.define("options", options);
    tabbar.refresh();

    // onAfterRender akan otomatis memanggil enableTabDragging lagi,
    // tapi dipanggil eksplisit juga untuk berjaga-jaga
    enableTabDragging(tabbar);

    // read visual order after Webix refresh, same as customTabsArray
    setTimeout(function () {
      var tabsList = $$("tabs").getTabbar().config.options;
      var actualOrder = tabsList
        .filter(function (cell) { return cell.id.includes("query") || cell.id.startsWith("z_query"); })
        .map(function (cell) { return cell.id === "query" ? "z_query" : cell.id; });
      console.log("Persisting tab order:", actualOrder);
      reorderStoreIDB(actualOrder).catch(function (err) {
        console.error("Failed to persist tab order:", err);
      });
    }, 200);
  }



function onCloseTab(tabId) {
  if (!!stateQuery.isRestoreLastQuery) {
    deleteStoreIDB(tabId);
  }
}

function focusEditorOnNewTab() {
  setTimeout(() => {
    const newActiveTabId = $$("tabs").getTabbar().getValue();
    if (newActiveTabId && newActiveTabId !== "query_welcome") {
      const newTval = newActiveTabId.split("_").pop();
      const newEdId = isInt(newTval) ? `${newActiveTabId}_sql_editor` : `z_query_sql_editor`;
      const newEditor = $$(newEdId);
      if (newEditor) {
        newEditor.getEditor(true).then((editor) => {
          editor.focus();
        });
      }
    }
  }, 100);
}

function closeTabWithValidation(tabId) {
  if (!tabId || tabId === "query_welcome") {
    return;
  }

  if (tabId.includes("query")) {
    const tval = tabId.split("_").pop();
    let edId = "";
    if (isInt(tval)) {
      edId = `${tabId}_sql_editor`;
    } else {
      edId = `z_query_sql_editor`;
    }
    const a = $$(edId);
    if (typeof a != "undefined") {
      if (a.getValue().length > 0) {
        webix.confirm("Are you sure?").then((result) => {
          if (result) {
            $$("tabs").removeView(tabId);
            onCloseTab(tabId);
            openWelcomeTab();
            focusEditorOnNewTab();
          }
        });
      } else {
        $$("tabs").removeView(tabId);
        onCloseTab(tabId);
        openWelcomeTab();
        focusEditorOnNewTab();
      }
    } else {
      $$("tabs").removeView(tabId);
      onCloseTab(tabId);
      openWelcomeTab();
      focusEditorOnNewTab();
    }
  } else {
    $$("tabs").removeView(tabId);
    onCloseTab(tabId);
    openWelcomeTab();
    focusEditorOnNewTab();
  }
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
    stateQuery.isRestoreLastQuery = webix.storage.local.get(LAST_QUERY_RESTORE);
    const _this = this;

    setDisableHistoryBrowser();
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
              onBeforeTabClick: function(id,ev){
                const div2 = document.querySelector(".tmp_resizing_col_div");
                if (div2) {
                    div2.remove();
                }
              },
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
              onAfterRender: function () {
                enableTabDragging(this);
              }
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
      // CTRL+ALT+M to close current tab
      if (e.keyCode == 77 && e.ctrlKey && e.altKey) {
        e.preventDefault();
        const currentTabId = $$("tabs").getTabbar().getValue();
        closeTabWithValidation(currentTabId);
      }
      // CTRL+ALT+LEFT to navigate to previous tab
      if (e.keyCode == 37 && e.ctrlKey && e.altKey) {
        e.preventDefault();
        const tabbar = $$("tabs").getTabbar();
        const options = tabbar.config.options;
        const currentTabId = tabbar.getValue();
        const currentIndex = options.findIndex((o) => String(o.id) === String(currentTabId));
        if (currentIndex > 0) {
          tabbar.setValue(options[currentIndex - 1].id);
          focusEditorOnNewTab();
        }
      }
      // CTRL+ALT+RIGHT to navigate to next tab
      if (e.keyCode == 39 && e.ctrlKey && e.altKey) {
        e.preventDefault();
        const tabbar = $$("tabs").getTabbar();
        const options = tabbar.config.options;
        const currentTabId = tabbar.getValue();
        const currentIndex = options.findIndex((o) => String(o.id) === String(currentTabId));
        if (currentIndex < options.length - 1) {
          tabbar.setValue(options[currentIndex + 1].id);
          focusEditorOnNewTab();
        }
      }
    });

    loadAppSetting();

    initContextMenu();

    restoreLastQuery(this);

    loadSnippet();

    // this.ui(SreensaverView).show();
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

    setDisableHistoryBrowser();

  }
}
