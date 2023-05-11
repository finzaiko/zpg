import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";

import {
  colorComboDBSource,
  isColorLight,
  pagerRow,
  pageSize,
  showToast,
  stripHtml,
} from "../../helpers/ui";
import { url as urlDb } from "../../models/Db";
import { url as urlViewData } from "../../models/ViewData";
import { state as stateBase } from "../../models/Base";
import { url as urlProfile } from "../../models/Profile";
import { url as urlShare } from "../../models/Share";
import { url, state, searchHistoryStore } from "../../models/Query";
import { QueryDatabase } from "./QueryDatabase";
import { QueryHelp } from "./QueryHelp";
import { userProfile } from "../../models/UserProfile";
import {
  LAST_DATATYPE,
  LAST_DB_CONN_QUERY,
  STORE_HISTORY,
  LAST_MINIMAP,
  LAST_SEARCHTYPE,
  LAST_HISTORY,
  LAST_MULTICONN,
  LAST_ADJUSTCOLS,
  BACKEND_URL,
  FONT_SIZE_EDITOR,
} from "../../config/setting";

import { copyToClipboard } from "../../helpers/copy";
import { url as urlUser } from "../../models/User";
import { getErrorMessage } from "../../helpers/api";
import { addStoreIDB, readStoreIDB, readStoreIDBByKey, updateStoreIDB, upsertStoreIDB } from "../../helpers/idb";

TimeAgo.addDefaultLocale(en);
let timeAgo = new TimeAgo("en-US");

function truncateString(str, n) {
  return str.length > n ? str.slice(0, n - 1) + "&nbsp;" : str; //&hellip;
}

function syntaxHighlight(json) {
  // https://stackoverflow.com/questions/4810841/pretty-print-json-using-javascript/7220510#7220510
  json = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    function (match) {
      var cls = "number";
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "key";
        } else {
          cls = "string";
        }
      } else if (/true|false/.test(match)) {
        cls = "boolean";
      } else if (/null/.test(match)) {
        cls = "null";
      }
      return '<span class="' + cls + '">' + match + "</span>";
    }
  );
}

function newQueryTab() {
  function isInt(value) {
    var x;
    return isNaN(value) ? !1 : ((x = parseFloat(value)), (0 | x) === x);
  }

  stateBase.currentTabQuery = parseInt(stateBase.currentTabQuery) + 1;
  const newViewId = parseInt(stateBase.currentTabQuery);
  let str = state.prefix;

  let strLast = str.substring(str.lastIndexOf("_") + 1, str.length);
  if (!isInt(strLast)) {
    state.prefix = state.prefix + "_" + newViewId;
  } else {
    let sto = state.prefix;
    let stl = sto.substring(0, sto.lastIndexOf("_"));
    state.prefix = stl + "_" + newViewId;
  }
  stateBase.viewScope.addTab({
    header: "Query " + newViewId,
    id: state.prefix,
    close: true,
    width: 150,
    body: QueryPage(state.prefix),
  });

  $$("tabs").getTabbar().setValue(state.prefix);
}

export function QueryPage(prefix, selectedDb) {
  state.countPage = parseInt(prefix.split("_")[2]) || 0;

  let searchOidSelected;

  let decorations = [];

  let QueryToolbar = {
    view: "toolbar",
    css: "z_query_toolbar",
    id: prefix + "_tb",
    elements: [
      {
        view: "button",
        type: "icon",
        css: "zmdi_padding",
        id: prefix + "_new_query_btn",
        autowidth: true,
        tooltip: "Open new Query",
        icon: "mdi mdi-play-box-multiple-outline",
        click: function () {
          newQueryTab();
        },
      },
      {
        view: "button",
        type: "icon",
        css: "zmdi_padding",
        id: prefix + "_showhide_db",
        autowidth: true,
        tooltip: "Show database content",
        icon: "mdi mdi-forwardburger",
        click: function () {
          const treeId = $$(prefix + "_db_tree_panel");
          const treeResizedId = $$(prefix + "_db_tree_panel_resizer");
          if (treeId.isVisible()) {
            treeId.hide();
            treeResizedId.hide();
            this.config.icon = "mdi mdi-forwardburger";
            this.config.tooltip = { template: "Show database content" };
            this.refresh();
            loadDb(false);
            $$(prefix + "_viewdata_btn").disable();
          } else {
            treeId.show();
            treeResizedId.show();
            this.config.icon = "mdi mdi-backburger";
            this.config.tooltip = { template: "Hide database content" };
            this.refresh();
            loadDb(true);
          }
        },
      },
      {
        view: "combo",
        id: prefix + "_source_combo",
        placeholder: "Source DB",
        width: 200,
        options: {
          width: 250,
          fitMaster: false,
          body: {
            // template:
            //   `<div style="background-color:#content#;margin:0;padding-left:4px;padding-right:4px;border-radius:3px;">#value#</div>`,
            template: function (obj) {
              let clr = "#475466",
                bg = "#ffffff";
              if (obj.content) {
                bg = obj.content;
              }
              if (!isColorLight(bg)) {
                clr = "#ffffff";
              }
              return `<div style="background-color:${obj.content};color:${clr};border-radius:3px;padding-left:4px;padding-right:4px;">${obj.value}</div>`;
            },
            url: `${urlProfile}/content?type=2&ls=true`,
            on: {
              onAfterLoad: function () {
                colorComboDBSource($$(prefix + "_source_combo"));
              },
            },
          },
          on: {
            onBeforeShow: function () {
              reloadDBConnCombo();
            },
          },
        },
        on: {
          onChange: function (id, val) {
            webix.storage.local.put(LAST_DB_CONN_QUERY, id);
            if (id) {
              $$(prefix + "_run_btn").enable();
            } else {
              $$(prefix + "_run_btn").disable();
            }

            const treeId = $$(prefix + "_db_tree_panel");
            if (treeId.isVisible()) {
              loadDb(true);
            }
            colorComboDBSource($$(prefix + "_source_combo"));
          },
        },
      },
      {
        view: "button",
        type: "icon",
        css: "zmdi_padding",
        id: prefix + "_dbconn_toggle",
        autowidth: true,
        tooltip: "Manage DB Connection",
        icon: "mdi mdi-connection",
        click: function () {
          this.$scope.ui(QueryDatabase).show();
        },
      },
      {
        view: "toggle",
        type: "icon",
        autowidth: true,
        css: "zmdi_padding",
        tooltip: "Show multi Connection",
        id: prefix + "_multiconn_toggle",
        icon: "mdi mdi-playlist-play",
        on: {
          onChange: function (v) {
            showhideMulticonn(v);
            webix.storage.local.put(LAST_MULTICONN, v);
          },
        },
      },
      {
        view: "button",
        type: "icon",
        css: "zmdi_padding",
        icon: "mdi mdi-table",
        id: prefix + "_viewdata_btn",
        tooltip: "View data selected tree or search",
        disabled: true,
        autowidth: true,
        click: function () {
          let profileId = $$(prefix + "_source_combo").getValue();
          let tableOid = $$(prefix + "_db_tree")
            .getSelectedId()
            .split("_")[0];
          if (!tableOid) {
            tableOid = searchOidSelected.split("_")[0];
          } else {
            webix.message({
              text: "Selected table view not defined",
              type: "error",
            });
            return false;
          }
          runViewData(profileId, tableOid);
        },
      },
      {
        view: "button",
        type: "icon",
        css: "zmdi_padding",
        icon: "mdi mdi-play",
        id: prefix + "_run_btn",
        tooltip: "Execute (Ctrl+Enter or F5)",
        disabled: true,
        autowidth: true,
        click: function () {
          runQuery($$(prefix + "_source_combo").getValue());
        },
      },
      {
        view: "button",
        type: "icon",
        css: "zmdi_padding",
        icon: "mdi mdi-playlist-check",
        tooltip: "Auto Format",
        autowidth: true,
        click: function () {
          autoFormat();
        },
      },
      {
        view: "button",
        tooltip: "Bookmark",
        id: prefix + "_bookmark_btn",
        type: "icon",
        css: "zmdi_padding",
        icon: "mdi mdi-bookmark-outline",
        autowidth: true,
        popup: {
          view: "contextmenu",
          data: [],
          submenuConfig: {
            width: 300,
          },
          on: {
            onBeforeShow: function () {
              this.clearAll();
              webix
                .ajax()
                .get(`${urlProfile}/content?type=4&limit=10`)
                .then((r) => {
                  let arr = [];
                  arr.push({
                    id: prefix + "_add_bookmark",
                    value:
                      "<span class='mdi mdi-star-plus-outline webix_icon'></span>  Add Bookmark",
                  });
                  arr.push({
                    id: prefix + "_manage_bookmark",
                    value: "<span class='webix_icon'></span>  Manage Bookmark",
                  });

                  const _data = r.json().data;
                  if (_data.length > 0) {
                    arr.push({ $template: "Separator" });
                    this.config.width = 300;
                  } else {
                    this.config.width = 160;
                  }
                  this.refresh();
                  _data.forEach((item, index) => {
                    let no = index + 1;
                    arr.push({ id: item.id, value: no + ". " + item.title });
                  });
                  this.parse(arr);
                });
            },
            onMenuItemClick: function (id) {
              if (id == prefix + "_add_bookmark") {
                let data = {
                  title: "",
                  content: $$(prefix + "_sql_editor").getValue(),
                  user_id: userProfile.userId,
                  type: 4,
                };
                webix
                  .ajax()

                  .post(urlProfile + "/content", data, (r) => {
                    webix.message({ text: "Bookmark added.", type: "success" });
                  });
              } else if (id == prefix + "_manage_bookmark") {
                openBookmarkManager();
              } else {
                webix
                  .ajax()
                  .get(`${urlProfile}/content/${id}?type=4`)
                  .then((r) => {
                    $$(prefix + "_sql_editor").setValue(r.json().data.content);
                  });
              }
            },
          },
        },
      },
      {
        view: "toggle",
        // label: "History",
        type: "icon",
        css: "zmdi_padding",
        icon: "mdi mdi-history",
        tooltip: "History",
        id: prefix + "_history_toggle",
        autowidth: true,
        on: {
          onChange: function (v) {
            showhideHistory(v);
            webix.storage.local.put(LAST_HISTORY, v);
          },
        },
      },
      {
        view: "text",
        css: "search_suggest",
        id: prefix + "_database_search",
        placeholder: "Search name..",
        width: 300,
        suggest: {
          keyPressTimeout: 500,
          template: "#value#",
          body: {
            css: "search_suggest_list",
            template: function (obj) {
              let val = `<span class='source_def_item'>${obj.value}</span>`,
                sty = "",
                typ = "";
              if (obj.type == "Table") {
                typ = "tbl";
              } else if (obj.type == "Function") {
                typ = "fun";
              }
              if (typeof obj.type != "undefined") {
                sty = `<span class='source_def_type source_def_type_${typ}'>${typ}</span>`;
              }
              return val + sty;
            },

            dataFeed: function (filtervalue, filter) {
              const sourceId = $$(prefix + "_source_combo").getValue();
              if (!sourceId) {
                webix.message({
                  text: "Ops, select source DB first",
                  type: "error",
                });
                return;
              }
              if (filtervalue.length < 3) {
                const viewId = $$(prefix + "_database_search");
                webix.extend(viewId, webix.OverlayBox);
                if (viewId) $$(viewId).hideOverlay();
                this.clearAll();
                return;
              }
              this.clearAll();
              this.load(
                `${urlDb}/content_search?id=${sourceId}&root=0&filter[value]=` +
                  filtervalue
              );
            },
            on: {
              onBeforeLoad: function () {
                const viewId = $$(prefix + "_database_search");
                webix.extend(viewId, webix.OverlayBox);
                if (viewId)
                  viewId.showOverlay(
                    `<span style='display:block;text-align:right;padding-right:10px;height:100%;line-height:2.5; color:orange' class='mdi mdi-circle-slice-8 mdi_pulsate'></span>`
                  );
              },
              onAfterLoad: function () {
                const viewId = $$(prefix + "_database_search");
                webix.delay(
                  function () {
                    webix.extend(viewId, webix.OverlayBox);
                    if (viewId) $$(viewId).hideOverlay();
                  },
                  this,
                  null,
                  2000
                );
              },
            },
          },
          on: {
            onValueSuggest: function (node) {
              loadSchemaContent(0, node.id);
            },
          },
        },
        on: {
          onKeyPress: function (code, e) {
            if (code == 9) {
              $$(prefix + "_sql_editor")
                .getEditor(true)
                .then((editor) => editor.focus());
            }
          },
        },
      },
      {
        view: "text",
        css: "search_suggest",
        id: prefix + "_database_search_content",
        placeholder: "Search content and press enter..",
        tooltip: "Type and enter",
        width: 300,
        hidden: true,
        on: {
          onKeyPress: function (code, e) {
            if (code == 13) {
              const sourceId = $$(prefix + "_source_combo").getValue();
              const filtervalue = this.getValue();
              const pageId = $$(prefix + "_page_panel");
              webix.extend(pageId, webix.ProgressBar);
              pageId.showProgress({
                type: "icon",
                icon: "mdi mdi-loading z_mdi_loader",
              });
              pageId.disable();

              webix
                .ajax()
                .get(
                  `${urlDb}/content_search?id=${sourceId}&root=0&filter[value]=${filtervalue}&type=content`
                )
                .then((r) => {
                  const rData = r.json();
                  const data = rData.data;
                  if (typeof data != "undefined") {
                    if ($$(prefix + "_sidemenu_right").isVisible()) {
                      $$(prefix + "_sidemenu_right").hide();
                    }
                    if ($$(prefix + "_history_preview").isVisible()) {
                      $$(prefix + "_history_preview").hide();
                      $$(prefix + "_sql_editor").show();
                    }

                    $$(prefix + "_history_toggle").setValue(false);
                    $$(prefix + "_multiconn_toggle").setValue(false);
                    $$(prefix + "_search_content_right").show();

                    const resultContent = $$(prefix + "_result_content");
                    resultContent.clearAll();
                    resultContent.parse(data);
                    resultContent.registerFilter(
                      $$(prefix + "_filter_content"),
                      { columnId: "content_name" },
                      {
                        getValue: function (view) {
                          return view.getValue();
                        },
                        setValue: function (view, value) {
                          view.setValue(value);
                        },
                      }
                    );
                  } else {
                    const resultContent = $$(prefix + "_result_content");
                    if (resultContent) {
                      resultContent.clearAll();
                    }
                    webix.message({ text: "No record found", type: "error" });
                  }
                  pageId.hideProgress();
                  pageId.enable();
                })
                .fail((e) => {
                  pageId.hideProgress();
                  pageId.enable();
                  webix.message({ text: getErrorMessage(e), type: "error" });
                });
            }
          },
        },
      },
      {
        view: "icon",
        icon: "mdi mdi-magnify",
        id: prefix + "_search_more_btn",
        tooltip: "Search by name",
        popup: {
          view: "popup",
          width: 120,
          body: {
            view: "list",
            data: [
              {
                id: prefix + "_sname",
                name: "name",
                icon: "mdi mdi-magnify",
                tooltip: "Search by name",
              },
              {
                id: prefix + "_scontent",
                name: "content",
                icon: "mdi mdi-text-search",
                tooltip: "Search by content",
              },
            ],
            template: "<span class='#icon#'></span> #name#",
            autoheight: true,
            select: true,
            on: {
              onItemClick: function (id) {
                this.getParentView().hide();
                const popBtn = $$(prefix + "_search_more_btn");
                const sel = this.getItem(id);
                popBtn.config.icon = sel.icon;
                popBtn.config.tooltip = sel.tooltip;
                popBtn.refresh();

                const search = $$(prefix + "_database_search");
                const searchContent = $$(prefix + "_database_search_content");
                if (id == prefix + "_sname") {
                  search.show();
                  search.focus();
                  searchContent.hide();
                } else if (id == prefix + "_scontent") {
                  search.hide();
                  searchContent.show();
                  searchContent.focus();
                }
              },
            },
          },
        },
      },
      {
        view: "button",
        type: "icon",
        icon: "mdi mdi-magnify",
        css: "zmdi_padding",
        id: prefix + "_search_detach_btn",
        tooltip: "Quick Search",
        autowidth: true,
        hidden: true,
        click: function () {
          openSearchDetach();
        },
      },

      {
        view: "icon",
        icon: "mdi mdi-share-variant-outline",
        css: "zmdi_padding",
        id: prefix + "_share_btn",
        tooltip: "Share to other users",
        autowidth: true,
        click: function () {
          openShareUser();
        },
      },

      {},
      {
        view: "icon",
        icon: "mdi mdi-help-circle-outline",
        id: prefix + "_help_btn",
        tooltip: "Show help, shortcut",
        autowidth: true,
        click: function () {
          this.$scope.ui(QueryHelp).show();
        },
      },
      {
        view: "icon",
        icon: "mdi mdi-dots-vertical",
        id: prefix + "_setting_more",
        tooltip: "More setting..",
        autowidth: true,
        click: function () {
          // settingMore.show();
          openMoreSetting();
        },
      },
    ],
  };

  let baseRootId, nodeId, baseDbName;
  let QueryDBTree = {
    id: prefix + "_db_tree_panel",
    hidden: true,
    rows: [
      {
        cols: [
          {
            view: "text",
            placeholder: "filter..",
            id: prefix + "_db_tree_filter",
            css: "z_db_tree_filter",
            on: {
              onTimedKeyPress: function () {
                $$(prefix + "_db_tree").filter("#value#", this.getValue());
              },
            },
          },
          {
            view: "icon",
            toolbar: "Refresh current selected DB",
            autowidth: true,
            id: prefix + "_db_tree_filter_reload",
            icon: "mdi mdi-reload",
            click: function () {
              loadDb(true);
            },
          },
        ],
      },
      {
        view: "tree",
        width: 250,
        id: prefix + "_db_tree",
        css: "z_db_tree",
        select: true,
        threeState: true,
        type: {
          icon: function (obj, common) {
            if (obj.open && obj.$count <= 0)
              return '<div class=" webix_icon mdi mdi-sync spin_mdi"></div>';
            return (
              '<div class="webix_tree_' +
              (obj.$count ? (obj.open ? "open" : "close") : "none") +
              '"></div>'
            );
          },
          my_folder: function (obj) {
            const suffix = obj.id.split("_")[1];
            if (suffix == "d") {
              return `<span class='webix_icon mdi mdi-database-outline ${
                obj.open ? "z_tree_d_open" : ""
              }'></span>`;
            }
            if (suffix == "s")
              return `<span class='webix_icon mdi mdi-rhombus-split-outline ${
                obj.open ? "z_tree_s_open" : ""
              }'></span>`;
            if (suffix == "t")
              return `<span class='webix_icon mdi mdi-table-large ${
                obj.open ? "z_tree_t_open" : ""
              }'></span>`;
            if (suffix == "u")
              return `<span class='webix_icon mdi mdi-table z_tree_u_open z_tree_u_open'></span>`;
            if (suffix == "f")
              return `<span class='webix_icon mdi mdi-script-text-outline ${
                obj.open ? "z_tree_f_open" : ""
              }'></span>`;
            if (suffix == "r")
              return `<span class='webix_icon mdi mdi-script-text-play-outline ${
                obj.open ? "z_tree_r_open" : ""
              }'></span>`;
            if (suffix == "v")
              return `<span class='webix_icon mdi mdi-view-grid-outline ${
                obj.open ? "z_tree_v_open" : ""
              }'></span>`;
            if (suffix == "y")
              return `<span class='webix_icon mdi mdi-view-module-outline z_tree_y_open z_tree_y_open'></span>`;
            if (suffix == "g")
              return `<span class='webix_icon mdi mdi-script-outline z_tree_g_open'></span>`;
            if (suffix == "w")
              return `<span class='webix_icon mdi mdi-script-outline z_tree_w_open'></span>`;
            return "<span class='webix_icon mdi mdi-radiobox-blank'></span>";
          },
        },
        filterMode: {
          showSubItems: false,
          level: 1,
        },
        template: "{common.icon()} {common.my_folder()} <span>#value#</span>",
        on: {
          onAfterSelect: function (id) {
            baseRootId = id;
            while (this.getParentId(baseRootId)) {
              baseRootId = this.getParentId(baseRootId);
            }
            baseDbName = this.getItem(baseRootId).value;
            loadSchemaContent(baseRootId, id);
          },
          onItemClick: function (id) {
            let itemRootId = id;
            let itemx = this.getItem(id);
            stateBase.currentDBSelected = itemx.value;
            while (this.getParentId(itemRootId)) {
              itemRootId = this.getParentId(itemRootId);
            }
            baseDbName = this.getItem(itemRootId).value;

            if (id.split("_")[1] == "u") {
              $$(prefix + "_viewdata_btn").enable();
            } else {
              $$(prefix + "_viewdata_btn").disable();
            }
          },
          onItemDblClick: function (id) {
            if (this.isBranchOpen(id)) {
              this.close(id);
            } else {
              this.open(id);
            }
          },
          onBeforeContextMenu: function (id, e, node) {
            // Right click not handle in this node: show functions trigger, views
            const nodeType = id.split("_")[1];
            if (nodeType == "g" || nodeType == "r" || nodeType == "y") {
              return webix.html.preventEvent(e);
            } else {
              return true;
            }
          },
          onAfterContextMenu: function (id, e, node) {
            this.select(id);
            baseRootId = id;
            while (this.getParentId(baseRootId)) {
              baseRootId = this.getParentId(baseRootId);
            }
            nodeId = id;
          },
          onDataRequest: function (id) {
            loadBranch(this, id);
            return false;
          },
          onBeforeLoad: function () {
            webix.extend(this, webix.OverlayBox);
            this.showOverlay("<div style='margin-top: 20px'>Loading...</div>");
          },
          onAfterLoad: function () {
            this.hideOverlay();
          },
          onAfterRender: webix.once(function () {
            const _this = this;
            let ctxMenu = this.$scope.ui({
              view: "contextmenu",
              data: [],
              on: {
                onBeforeShow: function () {
                  this.clearAll();
                  let arr = [];
                  const tre = $$(prefix + "_db_tree");
                  const nodeType = tre.getSelectedId().split("_")[1];
                  // Refresh only for have childs
                  if (
                    nodeType == "s" ||
                    nodeType == "t" ||
                    nodeType == "f" ||
                    nodeType == "r" ||
                    nodeType == "v"
                  ) {
                    arr.push({ id: "refresh", value: "Refresh" });
                  } else if (tre.getSelectedId().split("_")[1] == "u") {
                    // arr.push({ $template: "Separator" });
                    arr.push({
                      id: "view_data_all",
                      value: "View Data All Rows",
                    });
                    arr.push({
                      id: "view_data_last100",
                      value: "View Data Last 100",
                    });
                  }
                  this.parse(arr);
                },
                onItemClick: function (id) {
                  let profileId = $$(prefix + "_source_combo").getValue();
                  const nodeId = _this.getSelectedId();
                  const tableOid = nodeId.split("_")[0];
                  if (id == "view_data_all") {
                    runViewData(profileId, tableOid);
                  } else if (id == "view_data_last100") {
                    runViewData(profileId, tableOid, 1);
                  } else if (id == "refresh") {
                    loadBranch($$(prefix + "_db_tree"), nodeId, true);
                  }
                },
              },
            });
            ctxMenu.attachTo(this);
          }),
        },
      },
    ],
  };

  let QueryHistoryPreview = {
    type: "line",
    id: prefix + "_history_preview",
    hidden: true,
    cols: [
      {
        width: 100,
        css: { background: "#fff" },
        rows: [
          {
            cols: [
              {},
              {
                view: "button",
                type: "icon",
                icon: "mdi mdi-close",
                autowidth: true,
                tooltip: "Close",
                click: function () {
                  $$(prefix + "_history_preview").hide();
                  $$(prefix + "_sql_editor").show();
                },
              },
            ],
          },
          {
            cols: [
              {},
              {
                view: "button",
                type: "icon",
                icon: "mdi mdi-arrange-send-backward",
                autowidth: true,
                tooltip: "Copy to query editor",
                click: function () {
                  copyToQuery($$(prefix + "_history_content").getValue());
                  let editorId = $$(prefix + "_sql_editor");
                  editorId.focus();
                },
              },
            ],
          },
          {
            cols: [
              {},
              {
                view: "button",
                type: "icon",
                icon: "mdi mdi-content-copy",
                autowidth: true,
                id: prefix + "_copy_clipboard",
                tooltip: "Copy to clipboard",
                click: function () {
                  this.hide();
                  const ck = $$(prefix + "_copy_clipboard_done");
                  ck.show();
                  setTimeout(() => {
                    this.show();
                    ck.hide();
                  }, 1500);

                  copyToClipboard($$(prefix + "_history_content").getValue());
                },
              },
              {
                view: "button",
                // autowidth: true,
                width: 55,
                hidden: true,
                id: prefix + "_copy_clipboard_done",
                label:
                  '<svg class="animated-check" viewBox="0 0 24 24"><path d="M4.1 12.7L9 17.6 20.3 6.3" fill="none"/></svg>',
              },
            ],
          },
          {},
        ],
      },
      {
        css: "z_console_editor_panel",
        rows: [
          {
            view: "monaco-editor",
            css: "z_console_editor",
            id: prefix + "_history_content",
            language: "text",
            lineNumbers: "off",
            fontSize: "12px",
            borderless: true,
            renderLineHighlight: "none",
          },
        ],
      },
    ],
  };

  let historyAdminMode = false;

  function historyCols(isAdmin) {
    const title = [{ id: "title", header: "", fillspace: true }];
    const fname = [{ id: "fullname", header: "", width: 100 }];
    const tm = [
      {
        adjust: true,
        template: function (obj, common, value, column, index) {
          if (obj.content) {
            return `<span style='color: grey;font-style:italic;font-size:13;float:right;'>
          ${timeAgo.format(new Date(obj.created_at), "mini")}</span>`;
          }
        },
      },
    ];

    return isAdmin ? [...title, ...fname, ...tm] : [...title, ...tm];
  }

  let QuerySidemenuRight = {
    id: prefix + "_sidemenu_right",
    css: "z_query_sidemenu_right",
    hidden: true,
    // type: "wide",
    width: 300,
    rows: [
      {
        id: prefix + "_list_multi",
        hidden: true,
        rows: [
          {
            view: "toolbar",
            cols: [{ view: "label", label: "DB Connections" }, {}],
          },
          {
            view: "list",
            select: false,
            width: 300,
            type: {
              height: "auto",
            },
            url: `${urlProfile}/content?type=2&ls=true`,
            tooltip: webix.template("#conn_name#"),
            template: function (obj) {
              let clr = "#475466",
                bg = "#ffffff";
              if (obj.content) {
                bg = obj.content;
              }
              if (!isColorLight(bg)) {
                clr = "#ffffff";
              }
              return `<div style='background:${bg};color:${clr};border-radius: 2px;padding-left:4px;'>${obj.value} <span style='float:right;width:50px;line-height:1.3' class='run_button z_multi_conn_icon webix_button webix_icon mdi mdi-play hover_only'></span></div>`;
            },
            onClick: {
              run_button: function (e, id, target) {
                runQuery(id);
              },
            },
          },
        ],
      },
      {
        view: "resizer",
        css: "z_resizer_hor_thin",
        id: prefix + "_right_resizer",
        hidden: true,
      },
      {
        id: prefix + "_history",
        hidden: true,
        rows: [
          {
            view: "toolbar",
            cols: [
              { view: "label", label: "History", width: 50 },
              {
                view: "text",
                placeholder: "filter..",
                keyPressTimeout: 800,
                on: {
                  onTimedKeyPress: function () {
                    loadHistory(historyAdminMode ? 1 : 0, this.getValue());
                    /*
                    const value = this.getValue().toLowerCase();
                    $$(prefix + "_history_list").filter(function (obj) {
                      return obj.content.toLowerCase().indexOf(value) !== -1;
                    });
                    */
                  },
                },
              },
              {
                view: "icon",
                icon: "mdi mdi-chevron-down",
                tooltip: "Other options",
                click: function () {
                  if (!$$(prefix + "_history_tb_more").isVisible()) {
                    $$(prefix + "_history_tb_more").show();
                    this.config.icon = "mdi mdi-chevron-up";
                  } else {
                    $$(prefix + "_history_tb_more").hide();
                    this.config.icon = "mdi mdi-chevron-down";
                  }
                  this.refresh();
                },
              },
            ],
          },
          {
            view: "toolbar",
            id: prefix + "_history_tb_more",
            hidden: true,
            height: 32,
            cols: [
              {
                view: "icon",
                icon: "mdi mdi-refresh",
                css: "z_primary_color z_fontsize_18",
                tooltip: "Refresh",
                click: function () {
                  loadHistory(historyAdminMode ? 1 : 0);
                },
              },
              {
                view: "icon",
                icon: "mdi mdi-chevron-left",
                css: "z_primary_color z_fontsize_18",
                tooltip: "Previous page",
                click: function () {
                  const pagerId = $$(prefix + "_history_list").config.pager.id;
                  $$(pagerId).select("prev");
                },
              },
              {
                view: "icon",
                icon: "mdi mdi-chevron-right",
                tooltip: "Next page",
                css: "z_primary_color z_fontsize_18",
                click: function () {
                  const pagerId = $$(prefix + "_history_list").config.pager.id;
                  $$(pagerId).select("next");
                },
              },
              {},
              {
                view: "icon",
                icon: "mdi mdi-text",
                tooltip: "Admin: Show all users history",
                css: "z_primary_color z_fontsize_18",
                id: prefix + "_all_history",
                hidden: true,
                click: function () {
                  if (historyAdminMode) {
                    this.config.icon = "mdi mdi-text";
                  } else {
                    this.config.icon = "mdi mdi-text-long";
                  }
                  this.refresh();
                  historyAdminMode = !historyAdminMode;
                  const tbl = $$(prefix + "_history_list");
                  tbl.config.columns = historyCols(historyAdminMode);
                  tbl.refreshColumns();
                  loadHistory(historyAdminMode ? 1 : 0);
                },
              },
              {
                view: "icon",
                icon: "mdi mdi-delete-sweep-outline",
                css: "z_primary_color z_fontsize_18",
                tooltip:
                  "Clear all History<br>(history auto clear after 30 days)",
                click: function () {
                  webix.message({ text: "Not implement yet", type: "debug" });
                },
              },
            ],
          },
          {
            view: "datatable",
            id: prefix + "_history_list",
            css: "z_fade_list z_list_cursor_pointer",
            columns: [
              // { id: "title", header: "", fillspace: true },
              {
                fillspace: true,
                template: function (obj) {
                  return obj.title.match(/(.+)/)[0];
                },
              },
              {
                adjust: true,
                template: function (obj, common, value, column, index) {
                  if (obj.content) {
                    return `<span style='color: grey;font-style:italic;font-size:13;float:right;'>
                    ${timeAgo.format(new Date(obj.created_at), "mini")}</span>`;
                  }
                },
              },
            ],
            pager: {
              // id: prefix + "_pager_history",
              apiOnly: true,
              size: 100,
            },
            select: true,
            headerRowHeight: -1,
            url: `${urlProfile}/content?type=3`,
            on: {
              onBeforeLoad: function () {
                webix.extend(this, webix.OverlayBox);
                this.showOverlay(
                  "<div style='margin-top: 20px'>Loading...</div>"
                );
              },
              onAfterLoad: function () {
                this.hideOverlay();
              },
              onItemClick: function (id) {
                $$(prefix + "_history_preview").show();
                $$(prefix + "_sql_editor").hide();
                let item = this.getItem(id);
                $$(prefix + "_history_content").setValue(item.content);
                const editorHistoryId = $$(prefix + "_history_content");
                editorHistoryId.getEditor(true).then((editorHistory) => {
                  editorHistory.updateOptions({
                    readOnly: true,
                  });
                });
              },
              onItemDblClick: function (id) {
                copyToQuery(this.getItem(id).content);
                let editorId = $$(prefix + "_sql_editor");
                editorId.focus();
              },
            },
          },
        ],
        gravity: 2,
      },
    ],
  };

  let SearchContentResult = {
    id: prefix + "_search_content_right",
    hidden: true,
    width: 400,
    rows: [
      {
        view: "toolbar",
        cols: [
          { view: "label", label: "Result Content", width: 100 },
          {
            view: "text",
            id: prefix + "_filter_content",
            placeholder: "Filter..",
            on: {
              onTimedKeyPress: function () {
                $$(prefix + "_result_content").filterByAll();
              },
            },
          },
          {
            view: "icon",
            icon: "mdi mdi-close",
            tooltip: "Close",
            width: 50,
            click: function () {
              $$(prefix + "_search_content_right").hide();
            },
          },
        ],
      },
      {
        view: "datatable",
        select: true,
        resizeColumn: true,
        id: prefix + "_result_content",
        columns: [
          { id: "content_schema", header: "Schema" },
          { id: "content_name", header: "Name", fillspace: true },
          { id: "ttype", header: "Type", width: 50 },
        ],
        on: {
          onItemClick: function (sel) {
            loadSchemaContent(0, sel.row);
          },
        },
      },
    ],
  };

  function showhideHistory(v) {
    if ($$(prefix + "_search_content_right").isVisible()) {
      $$(prefix + "_search_content_right").hide();
    }

    if ($$(prefix + "_sidemenu_right").isVisible()) {
      if (v) {
        $$(prefix + "_history").show();
        loadHistory();
      } else {
        $$(prefix + "_history").hide();
        if (!$$(prefix + "_list_multi").isVisible()) {
          $$(prefix + "_sidemenu_right").hide();
        }
      }
    } else {
      $$(prefix + "_sidemenu_right").show();
      if (v) {
        $$(prefix + "_history").show();
        loadHistory();
      } else {
        $$(prefix + "_history").hide();
        if (!$$(prefix + "_list_multi").isVisible()) {
          $$(prefix + "_sidemenu_right").hide();
        }
      }
    }
    if (
      $$(prefix + "_list_multi").isVisible() &&
      $$(prefix + "_history").isVisible()
    ) {
      $$(prefix + "_right_resizer").show();
    } else {
      $$(prefix + "_right_resizer").hide();
    }
    $$(prefix + "_history_toggle").setValue(v);
  }

  function showhideMulticonn(v) {
    if ($$(prefix + "_search_content_right").isVisible()) {
      $$(prefix + "_search_content_right").hide();
    }

    if ($$(prefix + "_sidemenu_right").isVisible()) {
      if (v) {
        $$(prefix + "_list_multi").show();
      } else {
        $$(prefix + "_list_multi").hide();
        if (!$$(prefix + "_history").isVisible()) {
          $$(prefix + "_sidemenu_right").hide();
        }
      }
    } else {
      $$(prefix + "_sidemenu_right").show();
      if (v) {
        $$(prefix + "_list_multi").show();
      } else {
        $$(prefix + "_list_multi").hide();
        if (!$$(prefix + "_history").isVisible()) {
          $$(prefix + "_sidemenu_right").hide();
        }
      }
    }
    if (
      $$(prefix + "_list_multi").isVisible() &&
      $$(prefix + "_history").isVisible()
    ) {
      $$(prefix + "_right_resizer").show();
    } else {
      $$(prefix + "_right_resizer").hide();
    }
    $$(prefix + "_multiconn_toggle").setValue(v);
  }

  const openShareUser = () => {
    webix
      .ui({
        view: "window",
        modal: true,
        id: prefix + "_win_share_user",
        width: 300,
        height: 350,
        position: "center",
        move: true,
        head: {
          view: "toolbar",
          cols: [
            { view: "label", label: "Share to user" },
            {
              view: "icon",
              icon: "mdi mdi-close",
              tooltip: "Close me",
              align: "right",
              click: function () {
                $$(prefix + "_win_share_user").destructor();
              },
            },
          ],
        },
        body: {
          rows: [
            {
              id: prefix + "_usershare_table",
              view: "datatable",
              css: "z_usershare_table",
              columns: [{ id: "fullname", header: "Name", fillspace: true }],
              select: "row",
              multiselect: true,
              url: `${urlUser}/users?type=6`,
            },
            {
              view: "toolbar",
              cols: [
                {},
                {
                  view: "button",
                  value: "Share",
                  autowidth: true,
                  css: "webix_primary",
                  click: function () {
                    const userListId = $$(prefix + "_usershare_table")
                      .getSelectedId(true)
                      .join();
                    const sqlContent = $$(prefix + "_sql_editor").getValue();
                    if (userListId.length > 0 && sqlContent != "") {
                      addShareUser(userListId, sqlContent);
                    } else {
                      if (sqlContent.trim() == "") {
                        return webix.message({
                          text: "Opss, Nothing to share !",
                          type: "error",
                        });
                      }
                      webix.message({
                        text: "Please select user",
                        type: "error",
                      });
                    }
                  },
                },
              ],
            },
          ],
        },
      })
      .show();
  };

  const runViewData = (profileId, tableOid, type) => {
    webix
      .ajax()

      .get(`${url}/table_name?id=${profileId}&&oid=${tableOid}`)
      .then((r) => {
        const rData = r.json();
        let optionSql = "LIMIT 1000";
        if (type == 1) {
          optionSql = `ORDER BY id DESC LIMIT 100`;
        }
        let sql = `SELECT * FROM ${rData.tableschema}.${rData.tablename} ${optionSql}`;
        $$(prefix + "_sql_editor").setValue(sql);
        runQuery($$(prefix + "_source_combo").getValue());
      });
  };

  const addShareUser = (userListId, sql_content) => {
    const usr = userListId.split(",");
    if (usr.length > 1) {
      webix.message({
        text: "Not support multiple user selection yet",
        type: "error",
      });
      return;
    }
    const data = {
      share_to: userListId,
      content: sql_content,
    };
    webix
      .ajax()

      .post(`${urlShare}`, data, function (r) {
        webix.message({ text: "Share success", type: "success" });
        $$(prefix + "_win_share_user").close();
      });
  };

  const openBookmarkManager = () => {
    webix
      .ui({
        view: "window",
        modal: true,
        resize: true,
        id: prefix + "_win_bookmark_manage",
        width: 900,
        height: 700,
        position: "center",
        move: true,
        head: {
          view: "toolbar",
          cols: [
            { view: "label", label: "Bookmark Manager" },
            {
              view: "icon",
              icon: "mdi mdi-close",
              tooltip: "Close me",
              align: "right",
              click: function () {
                $$(prefix + "_win_bookmark_manage").destructor();
              },
            },
          ],
        },
        body: {
          cols: [
            {
              rows: [
                {
                  view: "text",
                  placeholder: "filter..",
                  id: prefix + "_bm_list_filter",
                  css: "z_db_tree_filter",
                  on: {
                    onTimedKeyPress: function () {
                      $$(prefix + "_bm_list").filter(
                        "#value#",
                        this.getValue()
                      );
                    },
                  },
                },
                {
                  view: "list",
                  width: 250,
                  drag: "order",
                  template: "<div style='cursor: pointer;'>#title#</div>",
                  id: prefix + "_bm_list",
                  select: true,
                  url: `${urlProfile}/content?type=4`,
                  on: {
                    onItemClick: function (id) {
                      $$(prefix + "_bm_toolbar").show();
                      $$(prefix + "_bm_sql_editor").show();
                      $$(prefix + "_bm_editor_tmpl").hide();

                      const sel = this.getItem(id);
                      let editorId = $$(prefix + "_bm_sql_editor");
                      editorId.setValue(sel.content);
                      $$(prefix + "_bm_title").setValue(sel.title);
                    },
                    onItemDblClick: function (id) {
                      const sel = this.getItem(id);
                      let editorId = $$(prefix + "_sql_editor");
                      editorId.setValue(sel.content);
                      $$(prefix + "_win_bookmark_manage").destructor();
                    },
                  },
                },
              ],
            },

            {
              view: "resizer",
              resizeColumn: { size: 1 },
              css: "z_resizer_small",
              id: "resizer",
            },
            {
              rows: [
                {
                  view: "toolbar",
                  id: prefix + "_bm_toolbar",
                  hidden: true,
                  cols: [
                    {
                      view: "button",
                      type: "icon",
                      icon: "mdi mdi-content-save-outline",
                      tooltip: "Save Changes",
                      autowidth: true,
                      css: "zmdi_padding",
                      click: function () {
                        let data = {
                          title: $$(prefix + "_bm_title").getValue(),
                          content: $$(prefix + "_bm_sql_editor").getValue(),
                          user_id: userProfile.userId,
                          type: 4,
                        };
                        const listId = $$(prefix + "_bm_list");
                        const id = listId.getSelectedId();

                        webix
                          .ajax()

                          .put(
                            urlProfile + "/content/" + id,
                            data,
                            function (res) {
                              listId.clearAll();
                              listId.load(
                                `${urlProfile}/content?type=4`,
                                "json",
                                function () {
                                  listId.select(id);
                                },
                                true
                              );
                              webix.message({
                                text: `<strong>${data.title}</strong> saved.`,
                                type: "success",
                              });
                            }
                          );
                      },
                    },
                    {
                      view: "button",
                      type: "icon",
                      icon: "mdi mdi-delete-outline",
                      tooltip: "Delete",
                      autowidth: true,
                      css: "zmdi_padding",
                      click: function () {
                        const listId = $$(prefix + "_bm_list");
                        const id = listId.getSelectedId();
                        const sel = listId.getItem(id);
                        webix
                          .ajax()

                          .del(urlProfile + "/content/" + id, function (res) {
                            listId.clearAll();
                            listId.load(
                              `${urlProfile}/content?type=4`,
                              "json",
                              function () {
                                $$(prefix + "_bm_title").setValue("");
                                $$(prefix + "_bm_sql_editor").setValue("");

                                $$(prefix + "_bm_toolbar").hide();
                                $$(prefix + "_bm_sql_editor").hide();
                                $$(prefix + "_bm_editor_tmpl").show();
                              },
                              true
                            );
                            webix.message({
                              text: `<strong>${sel.title}</strong> deleted.`,
                              type: "error",
                            });
                          });
                      },
                    },
                    {
                      view: "text",
                      placeholder: "Title..",
                      id: prefix + "_bm_title",
                      name: "bm_title",
                    },
                  ],
                },
                {
                  view: "monaco-editor",
                  id: prefix + "_bm_sql_editor",
                  hidden: true,
                  language: "sql",
                },
                {
                  id: prefix + "_bm_editor_tmpl",
                  template:
                    "<div style='color: grey;height:100%;text-align: center;padding-top: 30%;'>Select bookmark on the left</div>",
                },
              ],
            },
          ],
        },
      })
      .show();
  };

  const openSearchDetach = () => {
    const winWidth = 500,
      sidemenuWidth = 180;
    if ($$(prefix + "_search_detach_win")) {
      $$(prefix + "_search_detach_win").close();
    }
    const panelId = $$(prefix + "_page_panel");

    const search = {
      view: "text",
      css: "search_suggest_detach",
      id: prefix + "_database_search_detach",
      placeholder: "Search..",
      tooltip: "Escape to close",
      width: winWidth,
      height: 40,
      suggest: {
        keyPressTimeout: 500,
        css: "search_suggest_detach_item",
        body: {
          // template: "#name#<br>Type: #type#, Schema: #schema#",
          template: "#value#",
          type: {
            height: 38,
          },
          dataFeed: function (filtervalue, filter) {
            const sourceId = $$(prefix + "_source_combo").getValue();
            if (!sourceId) {
              webix.message({
                text: "Ops, select source DB first",
                type: "error",
              });
              return;
            }
            if (filtervalue.length < 3) {
              const viewId = $$(prefix + "_database_search_detach");
              webix.extend(viewId, webix.OverlayBox);
              if (viewId) $$(viewId).hideOverlay();
              this.clearAll();
              return;
            }
            this.clearAll();
            this.load(
              `${urlDb}/content_search?id=${sourceId}&root=0&filter[value]=` +
                filtervalue
            ).then((data) => {
              setTimeout(() => {
                searchHistoryStore.clearAll();
                searchHistoryStore.parse(data.json().data);
              }, 500);
            });
          },
          on: {
            onBeforeLoad: function () {
              const viewId = $$(prefix + "_database_search_detach");
              webix.extend(viewId, webix.OverlayBox);
              if (viewId)
                viewId.showOverlay(
                  `<span style='display:block;text-align:right;padding-right:15px;height:100%;line-height:1.8; color:orange' class='mdi mdi-circle-slice-8 mdi_pulsate'></span>`
                );
            },
            onAfterLoad: function () {
              const viewId = $$(prefix + "_database_search_detach");
              webix.delay(
                function () {
                  webix.extend(viewId, webix.OverlayBox);
                  if (viewId) $$(viewId).hideOverlay();
                },
                this,
                null,
                2000
              );
              // var yCount = this.count() < 100 ? this.count():20;
              // this.define({yCount:yCount});
              // this.refresh();
            },
          },
        },
        on: {
          onValueSuggest: function (node) {
            loadSchemaContent(0, node.id, panelId);
          },
        },
      },
      on: {
        onKeyPress: function (code, e) {
          if (code == 9) {
            $$(prefix + "_sql_editor")
              .getEditor(true)
              .then((editor) => editor.focus());
          }
          if (
            code == 13 &&
            this.getValue() == "" &&
            searchHistoryStore.count()
          ) {
            const listId = $$(prefix + "_search_detach_history");
            listId.show();
            // webix.html.triggerEvent(listId.$view, "MouseEvents", "click");
            webix.UIManager.setFocus(listId); //to set focus
            listId.select(listId.getFirstId());
          }
        },
      },
    };

    let sidebarSize = 0;
    if ($$("app:sidebar").config.collapsed) {
      sidebarSize = $$("app:sidebar").$width + 100; // estimate centered position
    }
    webix
      .ui({
        view: "fadeInWindow",
        head: false,
        modal: true,
        body: {
          padding: 2,
          rows: [
            search,
            {
              view: "list",
              height: 300,
              id: prefix + "_search_detach_history",
              hidden: true,
              template: "#value#",
              select: true,
              data: searchHistoryStore,
              on: {
                onItemClick: function (sel) {
                  loadSchemaContent(0, sel, panelId);
                },
                onKeyPress: function (code, e) {
                  if (code == 13) {
                    loadSchemaContent(0, this.getSelectedId(), panelId);
                  }
                },
              },
            },
          ],
        },
        id: prefix + "_search_detach_win",
        move: true,
        padding: 10,
        top: 100,
        left:
          $$(prefix + "_page_panel").$width / 2 -
          sidemenuWidth / 2 -
          sidebarSize,
        on: {
          onShow: function () {
            $$(prefix + "_database_search_detach").focus();
          },
        },
      })
      .show();
  };

  const openMoreSetting = () => {
    webix
      .ui({
        view: "sidemenu",
        width: 200,
        position: "right",
        state: function (state) {
          let toolbarHeight = $$(prefix + "_tb").$height;
          state.top = toolbarHeight;
          state.height -= toolbarHeight;
        },
        body: {
          rows: [
            {
              view: "toolbar",
              cols: [
                {
                  view: "label",
                  tooltip: "Current setting store in browser local storage",
                  label:
                    "<span style='padding-left:4px;color:#1ca1c1'>Setting</span>",
                },
              ],
            },
            {
              view: "checkbox",
              labelRight: "Show Data type",
              id: prefix + "_show_data_type",
              tooltip: "Show data type",
              name: "ck_show_dtype",
              labelWidth: 8,
              value: 0,
              on: {
                onChange: function (newVal, oldVal) {
                  state.isDataType = newVal;
                  webix.storage.local.put(LAST_DATATYPE, newVal);
                  /*
                  webix
                    .confirm({
                      title: "Change Search Style",
                      ok: "Yes, reload",
                      cancel: "Later",
                      text: `<span style='color:red'>WARNING:</span> This is trial feature, some query not work properly if any complex query, you could try and back disable this again
                    <br>Need reload this page to apply changes`,
                    })
                    .then(function () {
                      webix.storage.local.put(LAST_DATATYPE, newVal);
                      setInterval(() => location.reload(), 1000);
                    })
                    .fail(function () {});
                    */
                },
              },
            },
            {
              view: "checkbox",
              id: prefix + "_detach_quick_search",
              labelRight: "Detach Quick Search",
              tooltip: "Detach Quick Search",
              name: "ck_detach_search",
              labelWidth: 8,
              value: 0,
              on: {
                onChange: function (newVal, oldVal) {
                  state.isSearchDetach = newVal;
                  setSearchType();
                  webix.storage.local.put(LAST_SEARCHTYPE, newVal);
                },
              },
            },
            {
              view: "checkbox",
              id: prefix + "_show_minimap",
              labelRight: "Show minimap",
              tooltip: "Show minimap scrollbar",
              name: "ck_show_minimap",
              labelWidth: 8,
              value: 0,
              on: {
                onChange: function (newVal, oldVal) {
                  state.isMinimap = newVal;
                  setMinimap();
                  webix.storage.local.put(LAST_MINIMAP, newVal);
                },
              },
            },
            {
              view: "checkbox",
              id: prefix + "_disable_history",
              labelRight: "Disable History",
              tooltip: "Disable capture log history",
              name: "ck_disable_history",
              labelWidth: 8,
              value: 0,
              on: {
                onChange: function (newVal, oldVal) {
                  state.isDisableHistory = newVal;
                  // setMinimap();
                  webix.storage.local.put(STORE_HISTORY, newVal);
                },
              },
            },
            {
              view: "checkbox",
              id: prefix + "_adjust_cols",
              labelRight:
                "AutoFit Columns \n<span style='font-style:italic;'>(Query result a bit slower)</span>",
              tooltip: "Auto adjust column size",
              css: "multiline_label_checkbox",
              name: "ck_adjust_cols",
              labelWidth: 8,
              value: state.isAdjustCols,
              on: {
                onChange: function (newVal, oldVal) {
                  state.isAdjustCols = newVal;
                  // setMinimap();
                  webix.storage.local.put(LAST_ADJUSTCOLS, newVal);
                },
              },
            },
            {height: 8},
            /*
            {
              view: "combo",
              placeholder:"Editor Theme",
              id: prefix + "_adjust_cols",
              options: {
                url: `${BACKEND_URL}/assets/themes/themelist.json`,
              },
              on: {
                onChange: function(newv,oldv){
                  // https://github.com/brijeshb42/monaco-themes
                  fetch('/themes/Monokai.json')
                  .then(data => data.json())
                  .then(data => {
                    monaco.editor.defineTheme('monokai', data);
                    monaco.editor.setTheme('monokai');
                  })
                }
              }
            },
            */
            { template: "" },
          ],
        },
        on: {
          onShow: function () {
            $$(prefix + "_show_data_type").blockEvent();
            $$(prefix + "_detach_quick_search").blockEvent();
            $$(prefix + "_show_minimap").blockEvent();
            const ck = webix.storage.local.get(LAST_DATATYPE);
            if (ck) {
              $$(prefix + "_show_data_type").setValue(ck);
            }
            const st = webix.storage.local.get(LAST_SEARCHTYPE);
            if (st) {
              $$(prefix + "_detach_quick_search").setValue(st);
            }
            const mn = state.isMinimap || webix.storage.local.get(LAST_MINIMAP);
            if (mn) {
              $$(prefix + "_show_minimap").setValue(mn);
            }
            const hs = webix.storage.local.get(STORE_HISTORY);
            if (hs) {
              $$(prefix + "_disable_history").setValue(hs);
            }
            const ac = webix.storage.local.get(LAST_ADJUSTCOLS);
            if (ac) {
              $$(prefix + "_adjust_cols").setValue(ac);
            }
            $$(prefix + "_show_data_type").unblockEvent();
            $$(prefix + "_detach_quick_search").unblockEvent();
            $$(prefix + "_show_minimap").unblockEvent();
            $$(prefix + "_disable_history").unblockEvent();
            $$(prefix + "_adjust_cols").unblockEvent();
          },
          onHide: function () {
            this.close();
          },
        },
      })
      .show();
  };

  const openDetailCell = (type, content) => {
    const allowType = ["json", "jsonb", "text", "varchar"];
    if (allowType.indexOf(type) !== -1) {
      if (type == "json" || type == "jsonb") {
        // formatter json type result
        content = JSON.stringify(JSON.parse(content), null, 4);
        openWinCell(type, content);
      }

      if (content) {
        const ctn = content.match(/\n/gm); // get number of break line row results
        if (
          (type == "text" || type == "varchar") &&
          ((ctn && ctn.length > 0) || content.length > 50)
        ) {
          openWinCell(type, content);
        }
      }

      function openWinCell(type, content) {
        webix
          .ui({
            view: "window",
            modal: true,
            resize: true,
            id: prefix + "_win_detail_cell",
            width: 600,
            height: 400,
            position: "center",
            move: true,
            head: {
              view: "toolbar",
              cols: [
                { view: "label", label: "Detail Cell", width: 70 },
                {
                  view: "icon",
                  icon: "mdi mdi-content-copy",
                  autowidth: true,
                  // hidden: true,
                  id: prefix + "_copy_detail_cell",
                  tooltip: "Copy to clipboard",
                  css: "z_icon_color_primary z_icon_size_17",
                  click: function () {
                    this.hide();
                    const ck = $$(prefix + "_copy_detail_cell_done");
                    ck.show();
                    setTimeout(() => {
                      this.show();
                      ck.hide();
                    }, 1500);

                    copyToClipboard(content);
                  },
                },
                {
                  view: "template",
                  autowidth: true,
                  hidden: true,
                  css: { "padding-top": "3px" },
                  borderless: true,
                  id: prefix + "_copy_detail_cell_done",
                  template:
                    '<svg class="animated-check" viewBox="0 0 24 24"><path d="M4.1 12.7L9 17.6 20.3 6.3" fill="none"/></svg>',
                },
                {},
                {
                  view: "icon",
                  icon: "mdi mdi-close",
                  tooltip: "Close me",
                  align: "right",
                  click: function () {
                    $$(prefix + "_win_detail_cell").destructor();
                  },
                },
              ],
            },
            // body: {
            //   view: "textarea",
            //   css: "z_query_detail_cell",
            //   value: content,
            // },
            body: {
              view: "template",
              css: "z_query_detail_cell",
              // template: `<pre style='height:100%;overflow: auto;'>${content}</pre>`,
              template: `<pre id='${
                prefix + "_detail_cell_content"
              }' style='height:100%;overflow: auto;'></pre>`,
            },
            on: {
              onShow: function () {
                const s = document.querySelector(
                  "#" + prefix + "_detail_cell_content"
                );
                if (type == "json" || type == "jsonb") {
                  s.innerHTML = syntaxHighlight(content);
                } else {
                  s.innerText = content;
                }
              },
            },
          })
          .show();
      }
    }
  };

  const loadDb = (isShow) => {
    const srcId = $$(prefix + "_source_combo").getValue();
    const treeId = $$(prefix + "_db_tree");
    treeId.clearAll();
    if (isShow) {
      let reloadIconId = $$(prefix + "_db_tree_filter_reload");
      reloadIconId.config.icon =
        "mdi mdi-refresh-circle spin_mdi_right z_mdi_splin_color";
      reloadIconId.refresh();
      treeId.load(`${urlDb}?id=${srcId}&t=1`).then((_) => {
        setTimeout(() => {
          reloadIconId.config.icon = "mdi mdi-reload";
          reloadIconId.refresh();
        }, 600);
      });
    }
  };

  const loadBranch = (viewId, id, isContext) => {
    let reloadIconId = $$(prefix + "_db_tree_filter_reload");
    reloadIconId.config.icon =
      "mdi mdi-refresh-circle spin_mdi_right z_mdi_splin_color";
    reloadIconId.refresh();

    let rootroot;
    if (typeof isContext == "undefined") {
      let rootId = id;
      while (viewId.getParentId(rootId)) {
        rootId = viewId.getParentId(rootId);
      }
      rootroot = rootId;
    } else {
      rootroot = baseRootId;
    }
    var tree = viewId;

    const profileId = $$(prefix + "_source_combo").getValue();

    viewId.parse(
      webix
        .ajax()

        .get(`${urlDb}/schema?id=${profileId}&root=${rootroot}&parent=${id}`)
        .then(function (data) {
          const item = tree.getItem(id);
          setTimeout(() => {
            if (item.$count <= 0) {
              item.open = false;
              tree.refresh(id);
            }
            reloadIconId.config.icon = "mdi mdi-reload";
            reloadIconId.refresh();
          }, 600);
          return (data = data.json());
        })
    );
  };

  const runQuery = (inputSourceId) => {
    const editorId = $$(prefix + "_sql_editor");

    const getEditor = editorId.getEditor();
    const selectionText = getEditor.getSelection();
    const ed = getEditor.getModel().getValueInRange(selectionText);

    let selectionLineNo = 0;
    let isSelection = false;

    let sqlInput = "";
    if (ed.length > 0) {
      isSelection = true;
      sqlInput = ed;
      selectionLineNo = selectionText.positionLineNumber;
    } else {
      sqlInput = editorId.getValue();
    }

    let input = {
      source_id: inputSourceId,
      sql: sqlInput,
      dtype: state.isDataType,
      history: state.isDisableHistory, // is store history
      adjustcol: state.isAdjustCols,
    };

    if (input.sql != "" && inputSourceId) {
      webix.extend($$(prefix + "_page_panel"), webix.OverlayBox);
      $$(prefix + "_page_panel").showOverlay(
        `<div class="loading-content"><div class="loading-ico no-border"></div>
        <span id='${prefix}_z_cancel_query' class='mdi mdi-close-circle-outline' style='
        position: absolute;
        bottom: 15px;
        right: 15px;
        z-index: 999;
        font-size: 13px;
        cursor:pointer;
        color: #e15353;
        '>&nbsp;Cancel</span>
        <span>Running query...</span></div>`
      );

      document.getElementById(`${prefix}_z_cancel_query`).onclick =
        function () {
          alert("Not implemented yet");
          $$(prefix + "_page_panel").hideOverlay();
        };
      webix
        .ajax()

        .post(url + "/run", input)
        .then((r) => {
          let rData = r.json();

          let newArr;
          let newCfg;
          let isTableCanSave = false;

          if (!rData.error) {
            newArr = rData.data.map((elm) => {
              if (elm.hasOwnProperty("id")) {
                elm.id += "<i style='color:white;'>__" + webix.uid() + "</i>";
              }
              return elm;
            });
          }
          /*
          // ON TESTED NULL VALUE
          function styleNullValue(value,item){
            if(value=='[null]'){
              return 'z_cell_null';
            }
          }

          if (rData.config) {
            newCfg = rData.config.map(obj => ({ ...obj, cssFormat: styleNullValue}));
          }
          */

          let newView = {
            type: "clean",
            css: "z_tabbar_result",
            rows: [
              {
                cols: [
                  {
                    borderless: true,
                    view: "tabbar",
                    width: 310,
                    height: 30,
                    id: prefix + "_tabbar",
                    value: "listView",
                    multiview: true,
                    options: [
                      {
                        value: "Result",
                        id: prefix + "_result",
                        width: 150,
                      },
                      {
                        value: "Console",
                        id: prefix + "_console",
                        width: 150,
                      },
                    ],
                    on: {
                      onChange: function (v) {
                        if (v == prefix + "_console") {
                          $$(prefix + "_copy_result_clipboard").show();
                          $$(prefix + "_result_scrolldown").show();
                          $$(prefix + "_result_scrollup").show();
                          $$(prefix + "_save_result").hide();
                          $$(prefix + "_addrow_result").hide();
                          $$(prefix + "_addrow_result_spacer").hide();
                          $$(prefix + "_removerow_result").hide();
                          $$(prefix + "_removerow_result_spacer").hide();
                          $$(prefix + "_console")
                            .getEditor(true)
                            .then((editor) => {
                              editor.revealLineInCenter(
                                editor.getModel().getLineCount()
                              );
                            });
                            $$(prefix + "_export_result").hide();
                        } else {
                          if (isTableCanSave) {
                            $$(prefix + "_save_result").show();
                            $$(prefix + "_addrow_result").show();
                            $$(prefix + "_addrow_result_spacer").show();
                            $$(prefix + "_removerow_result").show();
                            $$(prefix + "_removerow_result_spacer").show();
                          }
                          $$(prefix + "_copy_result_clipboard").hide();
                          $$(prefix + "_result_scrolldown").hide();
                          $$(prefix + "_result_scrollup").hide();

                          if($$(prefix + "_result").count()>0){
                            $$(prefix + "_export_result").show();
                          }else{
                            $$(prefix + "_export_result").hide();
                          }
                        }
                      },
                    },
                  },
                  { width: 10 },
                  {
                    view: "icon",
                    // icon: "mdi mdi-table-arrow-up",
                    icon: "mdi mdi-content-save-outline",
                    autowidth: true,
                    hidden: true,
                    id: prefix + "_save_result",
                    tooltip: "Save changes",
                    css: "z_icon_color_primary z_icon_size_17",
                    click: function () {
                      const grid = $$(prefix + "_result");
                      grid.editStop();
                      let cache = grid.$values_cache;
                      if (typeof cache != "undefined") {
                        if (cache.length > 0) {
                          cache.forEach((o) => {
                            $$(prefix + "_result").removeCellCss(
                              o.id,
                              o.column,
                              "z_changes_cell_result",
                              false
                            );
                          });
                        }

                        const strQry = input.sql.toLowerCase().split("from");
                        const tableName = strQry.pop().trim().split(" ");

                        const uniqueAddedArr = Array.from(
                          new Set(cache.map((a) => a.id))
                        )
                          .map((id) => {
                            return cache.find((a) => a.id === id);
                          })
                          .filter((o) => o.id < 1);

                        let createdCache = [];
                        uniqueAddedArr.forEach((o) => {
                          createdCache.push(grid.getItem(o.id));
                        });

                        let editedCache = cache.filter((o) => o.id > 0);
                        const dataSave = [...createdCache, ...editedCache];
                        // return webix.message({text: 'Not implement yet!', type: "debug"});
                        if (cache.length > 0) {
                          const inputData = {
                            source_id: input.source_id,
                            table_name: tableName[0],
                            data: JSON.stringify(dataSave),
                          };
                          webix
                            .ajax()
                            .post(`${urlViewData}/save_result`, inputData)
                            .then(function (data) {
                              webix.message({
                                text: "Data saved",
                                type: "success",
                              });
                            });
                          grid.$values_cache = [];
                        } else {
                          webix.message({
                            text: "No data to save",
                            type: "error",
                          });
                        }
                      } else {
                        webix.message({
                          text: "Update first, no data to save",
                          type: "error",
                        });
                      }
                    },
                  },
                  { width: 10, id: prefix + "_addrow_result_spacer" },
                  {
                    view: "icon",
                    icon: "mdi mdi-table-row-plus-after",
                    autowidth: true,
                    hidden: true,
                    id: prefix + "_addrow_result",
                    tooltip: "Add new row",
                    css: "z_icon_color_primary z_icon_size_18",
                    click: function () {
                      $$(prefix + "_result").add({ id: -webix.uid() }, 0);
                    },
                  },
                  { width: 10, id: prefix + "_removerow_result_spacer" },
                  {
                    view: "icon",
                    icon: "mdi mdi-table-row-remove",
                    autowidth: true,
                    hidden: true,
                    id: prefix + "_removerow_result",
                    tooltip: "Remove selected row",
                    css: "z_icon_color_primary z_icon_size_18",
                    click: function () {
                      webix.message({
                        text: "Not implement yet",
                        type: "debug",
                      });
                    },
                  },
                  { width: 10 },
                  {
                    view: "icon",
                    icon: "mdi mdi-tray-arrow-down",
                    autowidth: true,
                    hidden: true,
                    id: prefix + "_export_result",
                    tooltip: "Export Result",
                    css: "z_icon_color_primary z_icon_size_18",
                    click: function () {
                      const format = webix.Date.dateToStr("%Y%m%d%h%m%s");
                      const timeStamp = format(new Date());
                      const tblId = $$(prefix + "_result");
                      webix.toExcel(tblId, {
                        filename: "QueryResult__" + timeStamp,
                      });
                    },
                  },
                  // {width: 10},
                  // space
                  {
                    view: "icon",
                    icon: "mdi mdi-content-copy",
                    autowidth: true,
                    id: prefix + "_copy_result_clipboard",
                    tooltip: "Copy result to clipboard",
                    css: "z_icon_color_primary z_icon_size_17",
                    click: function () {
                      const content = $$(prefix + "_console").getValue();
                      const val = content.split("--end:notice:--")[0];
                      if (typeof val != "undefined") {
                        this.hide();
                        const ck = $$(prefix + "_copy_result_clipboard_done");
                        ck.show();
                        setTimeout(() => {
                          this.show();
                          ck.hide();
                        }, 1500);

                        copyToClipboard(val);
                      } else {
                        webix.message({
                          text: "No content to copy",
                          type: "debug",
                        });
                      }
                    },
                  },
                  {
                    view: "template",
                    autowidth: true,
                    hidden: true,
                    width: 31,
                    css: { "padding-top": "3px" },
                    borderless: true,
                    id: prefix + "_copy_result_clipboard_done",
                    template:
                      '<svg class="animated-check" viewBox="0 0 24 24"><path d="M4.1 12.7L9 17.6 20.3 6.3" fill="none"/></svg>',
                  },
                  { width: 10 },
                  {
                    view: "icon",
                    icon: "mdi mdi-arrow-collapse-down",
                    autowidth: true,
                    hidden: true,
                    id: prefix + "_result_scrolldown",
                    tooltip: "Scroll to bottom",
                    css: "z_icon_color_primary z_icon_size_16",
                    click: function () {
                      $$(prefix + "_console")
                        .getEditor(true)
                        .then((editor) => {
                          editor.revealLineInCenter(
                            editor.getModel().getLineCount()
                          );
                        });
                    },
                  },
                  { width: 10 },
                  {
                    view: "icon",
                    icon: "mdi mdi-arrow-collapse-up",
                    autowidth: true,
                    hidden: true,
                    id: prefix + "_result_scrollup",
                    tooltip: "Scroll to top",
                    css: "z_icon_color_primary z_icon_size_16",
                    click: function () {
                      $$(prefix + "_console")
                        .getEditor(true)
                        .then((editor) => {
                          editor.revealLineInCenter(1);
                        });
                    },
                  },
                  pagerRow(prefix + "_result_row_pager"),
                  { width: 10 },
                  {
                    view: "button",
                    label: "X",
                    autowidth: true,
                    click: function () {
                      $$(prefix + "_resizer").hide();
                      $$(prefix + "_result_scrollview").hide();
                    },
                  },
                ],
              },
              {
                animate: false,
                cells: [
                  {},
                  {
                    view: "datatable",
                    datafetch: pageSize,
                    select: "row",
                    editable: true,
                    id: prefix + "_result",
                    css: "z_query_result_grid webix_data_border webix_dtable",
                    columns: rData.config,
                    // columns: newCfg,
                    resizeColumn: true,
                    data: rData.data,
                    // data: newArr,
                    maxColumnWidth: state.isAdjustCols ? 260 : null,
                    resizeRow: true,
                    pager: prefix + "_result_row_pager",
                    on: {
                      onAfterLoad: function () {
                        /*
                        if(rData.err_status>0){
                          // webix.message({text: rData.err_msg, type: "error"});
                            const resultTblId = $$(prefix + "_result");
                            webix.extend(resultTblId, webix.OverlayBox);
                            resultTblId.showOverlay(`<div style=' display: table;height:100%;width:100%;font-size:14px;background: rgba(255,0,0,0.5) '>
                            <div style='display: table-cell; vertical-align: middle;color:white'>${rData.err_msg}</div>`);
                            setTimeout(() => resultTblId.hideOverlay(), 3000);
                        }
                        */
                        if (this.count() > 0) {
                          $$(prefix + "_export_result").show();
                        } else {
                          $$(prefix + "_export_result").hide();
                        }
                      },
                      onItemClick: function (id, e, trg) {
                        const cols = this.config.columns;
                        const type = cols.find((o) => o.id == id.column).ztype;
                        const sel = this.getItem(id);
                        openDetailCell(type, sel[id.column]);
                      },
                      onAfterEditStop: function (state, editor) {
                        if (state.old == state.value) return true;
                        if (!this.$values_cache) this.$values_cache = [];

                        const r = this.getItem(editor.row);
                        let idRow = editor.row;
                        let idDb = -1;
                        if (typeof r["id_0"] != "undefined") {
                          idDb = r["id_0"];
                        }
                        this.$values_cache.push({
                          id: idRow,
                          id_db: idDb,
                          column: editor.column,
                          value: state.value,
                        });
                        $$(this).addCellCss(
                          editor.row,
                          editor.column,
                          "z_changes_cell_result",
                          true
                        );
                        // $$(this).removeCellCss(editor.row, editor.column, "z_cell_null", true);
                      },
                    },
                    ready: function () {
                      if (state.isAdjustCols) {
                        const cols = this.config.columns;
                        cols.forEach((o) => {
                          this.getColumnConfig(o.id).maxWidth =
                            Number.MAX_SAFE_INTEGER;
                        });
                      }
                    },
                    /*
                    scheme:{
                      $change:function(item){
                      }
                    }
                    */
                  },
                  {
                    view: "monaco-editor",
                    css: "z_console_editor",
                    id: prefix + "_console",
                    language: "text",
                    lineNumbers: "off",
                    fontSize: "12px",
                    borderless: true,
                    renderLineHighlight: "none",
                    // readOnly: true,
                  },
                ],
              },
            ],
          };

          let views = $$(prefix + "_scrollview_body").getChildViews();
          if (views[0]) {
            $$(prefix + "_scrollview_body").removeView(views[0]);
          }
          $$(prefix + "_resizer").show();
          $$(prefix + "_result_scrollview").show();

          let lineNo;

          if (!rData.error) {
            $$(prefix + "_scrollview_body").addView(newView);
            if (typeof rData.message != "undefined") {
              $$(prefix + "_console").setValue(rData.message);
            }
            $$(prefix + "_tabbar").setValue(prefix + "_result");
            lineNo = 0;

            isCanSave($$(prefix + "_source_combo").getValue(), input.sql).then(
              (d) => {
                const data = d.json();
                if (data.data) {
                  isTableCanSave = true;
                  $$(prefix + "_save_result").show();
                  $$(prefix + "_addrow_result").show();
                  $$(prefix + "_addrow_result_spacer").show();
                  $$(prefix + "_removerow_result").show();
                  $$(prefix + "_removerow_result_spacer").show();
                } else {
                  isTableCanSave = false;
                  $$(prefix + "_save_result").hide();
                  $$(prefix + "_addrow_result").hide();
                  $$(prefix + "_removerow_result").hide();
                  $$(prefix + "_addrow_result_spacer").hide();
                  $$(prefix + "_removerow_result_spacer").hide();
                }
              }
            );

          } else {
            $$(prefix + "_scrollview_body").addView(newView);
            let output = rData.error;

            if (rData.err_line) {
              lineNo = Number(rData.err_line);

              if (lineNo > 0) {
                const getEditorId = $$(prefix + "_sql_editor").getEditor();

                getEditorId.revealLineInCenter(lineNo);

                const position = getEditorId.getModel().getPositionAt(rData.err_position);
                const { lineNumber, column } = position;

                lineNo = isSelection ? lineNo + selectionLineNo - 1 : lineNo;

                getEditorId.setPosition({ lineNumber: lineNo, column: 1 });

                const colStart = column <=2 ? 1 : column-2;
                const colEnd = column <=2 ? 2 : column;
                // https://snippet.webix.com/prqn82na
                let deco = getEditorId.deltaDecorations(
                  [],
                  [
                    {
                      range: new monaco.Range(lineNo, 0, lineNo, 0),
                      options: {
                        isWholeLine: false,
                        className: 'ed_line_error_decoration',
                        glyphMarginClassName: "myGlyphMarginClass",
                        linesDecorationsClassName: "breakpointStyle",
                        marginClassName: "rightLineDecoration",
                        inlineClassName: "problematicCodeLine",
                      },
                    },
                    {
                      range: new monaco.Range(lineNo, colStart, lineNo, colEnd),
                      options: {
                        isWholeLine: false,
                        className: 'ed_char_error_decoration',
                      },
                    },
                  ]
                );

                decorations.push(deco);
              }
            }

            $$(prefix + "_console").setValue(
              output.charAt(0).toUpperCase() + output.slice(1)
            );
            $$(prefix + "_tabbar").setValue(prefix + "_console");
          }

          showToast(rData.message_toas, `toasify_${rData.type_toas}`); // .replace(/(\r\n|\n|\r)/gm, " ").trim()

          // Reset decoration
          if (lineNo == 0) {
            $$(prefix + "_sql_editor")
              .getEditor(true)
              .then((ed) => {
                decorations.forEach((el, i) => {
                  const targetId = decorations[i];
                  targetId.forEach(ti=>{
                    ed.deltaDecorations([ti], []);
                  })
                });
                decorations = [];
              });
          }

          const editorConsoleId = $$(prefix + "_console");
          editorConsoleId.getEditor(true).then((editorConsole) => {
            editorConsole.updateOptions({
              readOnly: true,
            });
          });

          $$(prefix + "_page_panel").hideOverlay();
          loadHistory();
          copyFieldName();
        })
        .fail((err) => {
          setTimeout(() => {
            webix.message({
              text: err.responseText,
              type: "error",
            });
            $$(prefix + "_page_panel").hideOverlay();
          }, 1000);
        });
    } else {
      webix.message({
        text: "Select DB Connection and type SQL your command",
        type: "error",
      });
    }
  };

  const copyToQuery = (val) => {
    $$(prefix + "_sql_editor").setValue(val);
    $$(prefix + "_history_preview").hide();
    $$(prefix + "_sql_editor").show();
  };

  function loadHistory(showAll = 0, search = "") {
    let listId = $$(prefix + "_history_list");
    listId.clearAll();
    let qs = "";
    if (search) {
      qs = `&search=${search}`;
    }
    listId.load(`${urlProfile}/content?type=3&sa=${showAll}${qs}`);
  }

  function copyFieldName() {
    const resultTblId = $$(`${prefix}_result`);
    webix.event(resultTblId.$view, "contextmenu", function (e, node) {
      const hasHeader = e.srcElement.classList.contains("webix_hcell");
      if (hasHeader) {
        webix.html.preventEvent(e);
        const pos = resultTblId.locate(e);
        if (pos && !pos.row) {
          webix
            .ui({
              view: "contextmenu",
              data: ["Copy Field Name"],
              click: function (id, context) {
                const temp = pos.column.split("_");
                temp.pop();
                copyToClipboard(temp.join("_"));
              },
            })
            .show(e);
        }
      }
    });
  }

  function reloadDBConnCombo() {
    const cmbId = $$(prefix + "_source_combo");
    var cmbList = cmbId.getPopup().getList();
    cmbList.clearAll();
    cmbId.setValue("");
    cmbId.getPopup().getList().unselect();
    cmbList.load(urlProfile + "/content?type=2&ls=true");
  }

  const autoFormat = () => {
    let options = {
      uppercase: true,
    };
    $$(prefix + "_sql_editor").setValue(
      sqlFormatter.format($$(prefix + "_sql_editor").getValue(), options)
    );
  };

  const initQueryEditor = () => {
    let editorId = $$(prefix + "_sql_editor");

    // const changeCommandKeybinding = (editor, id, keybinding) => {
    //   editor._standaloneKeybindingService.addDynamicKeybinding("-" + id);
    //   editor._standaloneKeybindingService.addDynamicKeybinding(id, keybinding);
    // };
    webix.extend(editorId, webix.ProgressBar);
    editorId.showProgress({
      type: "icon",
      icon: "mdi mdi-loading z_mdi_loader",
    });
    editorId.disable();

    editorId.getEditor(true).then((editor) => {
      editorId.hideProgress();
      editorId.enable();

      // Replace current shortcut
      // changeCommandKeybinding(
      //   editor,
      //   "editor.action.deleteLines",
      //   monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_E
      // );
      // END: Replace ..

      editor.focus();

      let edFontSize = FONT_SIZE_EDITOR;
      if (stateBase.appProfile && Array.isArray(stateBase.appProfile)) {
        edFontSize = stateBase.appProfile.find(
          (o) => o.m_key == "editor_font_size"
        ).m_val;
      }
      editor.updateOptions({
        fontSize: edFontSize + "px",
      }),
        editor.addAction({
          id: "run-query",
          label: "Run Query",
          keybindings: [
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
            monaco.KeyCode.F5,
          ],
          precondition: null,
          keybindingContext: null,
          contextMenuGroupId: "navigation",
          contextMenuOrder: 1.5,
          run: function (ed) {
            runQuery($$(prefix + "_source_combo").getValue());
            return null;
          },
        }),
        editor.addAction({
          id: "auto-format-sql",
          label: "Auto format sql",
          keybindings: [
            monaco.KeyMod.Shift | monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_F,
          ],
          precondition: null,
          keybindingContext: null,
          contextMenuGroupId: "navigation",
          contextMenuOrder: 1.5,
          run: function (ed) {
            autoFormat();
            return null;
          },
        });
      editor.addAction({
        id: "search-focus",
        label: "Focus Quick Search",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Semicolon],
        precondition: null,
        keybindingContext: null,
        contextMenuGroupId: "navigation",
        contextMenuOrder: 1.5,
        run: function (ed) {
          if (state.isSearchDetach) {
            openSearchDetach();
          } else {
            $$(prefix + "_database_search").focus();
            $$(prefix + "_database_search")
              .getInputNode()
              .select();
          }

          return null;
        },
      }),
        editor.addAction({
          id: "open-new-query-ed",
          label: "Open New Query",
          keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyM],
          precondition: null,
          keybindingContext: null,
          contextMenuGroupId: "navigation",
          contextMenuOrder: 1.5,
          run: function (ed) {
            newQueryTab();
            return null;
          },
        });


        // Tester offline data
        // const _data = {value: "test1", modified: new Date().getTime()};
        // // addStoreIDB(_data, prefix);

        // upsertStoreIDB(_data, prefix);
        // setTimeout(() => {
        //   console.log("readddd");
        //   readStoreIDB().then(o=>{
        //     console.log('o',o);
        //   });

        //   readStoreIDBByKey("z_query2").then(o=>{
        //     console.log('o2',o);
        //   })
        // }, 2000);

        // setTimeout(() => {
        //   const _data = {value: "test2 updated", modified: new Date().getTime()};
        //   updateStoreIDB(_data, "z_query")
        // }, 3000);
        // onChange Editor

        // editor.getModel().onDidChangeContent((event)=>{
        //   // console.log('event== ',event);
        //   // console.log(editor.getValue());
        //   const _data = {value: editor.getValue(), modified: new Date().getTime()};
        //   upsertStoreIDB(_data, prefix);
        // });

        // END: Tester

    });
  };

  const setSearchType = () => {
    if (state.isSearchDetach) {
      $$(prefix + "_database_search").hide();
      $$(prefix + "_database_search_content").hide();
      $$(prefix + "_search_more_btn").hide();
      $$(prefix + "_search_detach_btn").show();

      webix.UIManager.addHotKey("Esc", function () {
        if ($$(prefix + "_search_detach_win")) {
          const boxes = document.querySelectorAll("body > div.webix_modal");
          boxes.forEach((box) => {
            box.style.backgroundColor = "#000";
          });
          $$(prefix + "_search_detach_win").hide();
        }
      });
    } else {
      $$(prefix + "_database_search_content").hide();
      $$(prefix + "_database_search").show();
      $$(prefix + "_search_more_btn").show();
      $$(prefix + "_search_detach_btn").hide();
    }
  };

  const setMinimap = () => {
    const editorId = $$(prefix + "_sql_editor");
    editorId.getEditor(true).then((editor) => {
      editor.updateOptions({
        // minimap: state.LAST_MINIMAP,
        minimap: {
          enabled: state.isMinimap,
          // enabl   ed: true
        },
      });
      6;
    });
  };

  const isCanSave = (profileId, sqlString) => {
    const strQry = sqlString.toLowerCase().split("from");
    const tableName = strQry.pop().trim().split(" ");
    return webix
      .ajax()
      .get(`${url}/is_table?id=${profileId}&table=${tableName}`);
  };

  const loadSchemaContent = (itemRootId, oid, panelId) => {
    searchOidSelected = oid;
    const typ = oid.split("_")[1];

    if (typ == "g" || typ == "u" || typ == "y" || typ == "w") {
      let profileId = $$(prefix + "_source_combo").getValue();
      let viewId = $$(prefix + "_sql_editor");
      webix.extend(viewId, webix.ProgressBar);
      viewId.showProgress({
        type: "top",
      });
      webix
        .ajax()
        .get(
          `${urlDb}/schema_content?id=${profileId}&root=${itemRootId}&oid=${oid}`
        )
        .then(function (data) {
          viewId.hideProgress();
          viewId.setValue(data.json().data);
          const boxes = document.querySelectorAll("body > div.webix_modal");
          boxes.forEach((box) => {
            box.style.backgroundColor = "#000";
          });
          $$(prefix + "_search_detach_win").close();
        });
    }
    if (typ == "u") {
      $$(prefix + "_viewdata_btn").enable();
    } else {
      $$(prefix + "_viewdata_btn").disable();
    }
  };

  let QueryPage = {
    id: prefix + "_page_panel",
    css: "z_query_page_panel",
    rows: [
      {
        rows: [
          QueryToolbar,
          {
            cols: [
              QueryDBTree,
              {
                  view: "resizer",
                  css: "z_resizer_smaller",
                  id: prefix + "_db_tree_panel_resizer",
                  hidden: true,
                },
              {
                view: "monaco-editor",
                id: prefix + "_sql_editor",
                language: "sql",
                minimap: {
                  enabled: false,
                },
              },
              QueryHistoryPreview,
              QuerySidemenuRight,
              SearchContentResult,
            ],
          },
        ],
        gravity: 2,
      },
      {
        view: "resizer",
        id: prefix + "_resizer",
        css: "z_resizer",
        hidden: true,
      },
      {
        view: "scrollview",
        id: prefix + "_result_scrollview",
        hidden: true,
        scroll: false,
        body: {
          id: prefix + "_scrollview_body",
          rows: [],
        },
      },
    ],
  };

  let settingMore;

  let view = {
    id: prefix,
    type: "clean",
    borderless: true,
    rows: [
      {
        type: "clean",
        borderless: true,
        rows: [QueryPage],
      },
    ],
    on: {
      // onViewShow: function () {
      onViewShow: webix.once(function (id) {
        // onInit, onReady
        state.isDataType = webix.storage.local.get(LAST_DATATYPE);
        state.isSearchDetach = webix.storage.local.get(LAST_SEARCHTYPE);
        state.isMinimap = webix.storage.local.get(LAST_MINIMAP);

        const cmbId = $$(prefix + "_source_combo");
        if (typeof selectedDb != "undefined") {
          setTimeout(() => {
            let listCmb = cmbId.getPopup().getList().serialize();
            const c = listCmb.filter((v) => {
              return v.value == selectedDb;
            });
            $$(prefix + "_source_combo").setValue(c[0].id);
          }, 500);
        } else {
          const db = webix.storage.local.get(LAST_DB_CONN_QUERY);
          if (db) {
            $$(prefix + "_source_combo").setValue(db);
          }
        }

        if (userProfile.userLevel == 1) {
          $$(prefix + "_all_history").show();
        }

        const lhs = webix.storage.local.get(LAST_HISTORY);
        if (lhs) {
          showhideHistory(lhs);
        }
        const lmt = webix.storage.local.get(LAST_MULTICONN);
        if (lmt) {
          showhideMulticonn(lmt);
        }

        const ac = webix.storage.local.get(LAST_ADJUSTCOLS);
        if (ac) {
          state.isAdjustCols = ac;
        }

        setSearchType();

        initQueryEditor();

        setMinimap();
      }),
      onDestruct: function () {
        settingMore = {};
      },
    },
  };

  // Set default last state

  return view;
}

// Open POPUP select
// https://snippet.webix.com/m7mz2p6t
