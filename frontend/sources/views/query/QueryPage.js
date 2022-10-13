import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";

import { pagerRow, pageSize } from "../../helpers/ui";
import { defaultHeader } from "../../helpers/api";
import { url as urlDb } from "../../models/Db";
import { state as stateBase } from "../../models/Base";
import { url as urlProfile } from "../../models/Profile";
import { url, state } from "../../models/Query";
import { QueryDatabase } from "./QueryDatabase";
import { QueryHelp } from "./QueryHelp";
import {
  LAST_DATATYPE,
  LAST_DB_CONN_QUERY,
  LAST_SEARCHTYPE,
} from "../../config/setting";
import { userId } from "../../../../backend/src/test/user-profile.test";
import { FONT_SIZE_EDITOR } from "../../../../backend/src/config/contant";
import { copyToClipboard } from "../../helpers/copy";
// import copy from 'copy-text-to-clipboard';

TimeAgo.addDefaultLocale(en);
let timeAgo = new TimeAgo("en-US");

function truncateString(str, n) {
  return str.length > n ? str.slice(0, n - 1) + "&nbsp;" : str; //&hellip;
}

function newQueryTab() {
  function isInt(value) {
    var x;
    return isNaN(value) ? !1 : ((x = parseFloat(value)), (0 | x) === x);
  }

  const newViewId = parseInt(stateBase.currentTabQuery) + 1;
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
  stateBase.currentTabQuery++;
}

export function QueryPage(prefix, selectedDb) {
  // console.log(`prefix`, prefix);
  state.countPage = parseInt(prefix.split("_")[2]) || 0;

  let searchState = prefix + "_sname";
  let searchDetachWin;

  let decorations = [];

  const sType = webix.storage.local.get(LAST_SEARCHTYPE) || 0;

  let QueryToolbar = {
    view: "toolbar",
    css: "z_query_toolbar",
    id: prefix + "_tb",
    elements: [
      {
        view: "button",
        type: "icon",
        css: "zmdi_padding",
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
          const treeId = $$(prefix + "_db_tree");
          if (treeId.isVisible()) {
            treeId.hide();
            this.config.icon = "mdi mdi-forwardburger";
            this.config.tooltip = { template: "Show database content" };
            this.refresh();
            loadDb(false);
            $$(prefix+"_viewdata_btn").disable();
          } else {
            treeId.show();
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
          url: `${urlProfile}/content?type=2&ls=true`,
          on: {
            onBeforeShow: function () {
              reloadDBConnCombo();
            },
          },
        },
        on: {
          onChange: function (id, val) {
            // console.log(`prefix>>>`, prefix);
            webix.storage.local.put(LAST_DB_CONN_QUERY, id);
            if (id) {
              $$(prefix + "_run_btn").enable();
            } else {
              $$(prefix + "_run_btn").disable();
            }
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
        // icon: "mdi mdi-wrap-disabled",
        // icon: "mdi mdi-page-next-outline",
        // icon: "mdi mdi-card-text-outline",
        icon: "mdi mdi-playlist-play",
        on: {
          onChange: function (v) {
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
          },
        },
      },
      {
        view: "button",
        type: "icon",
        css: "zmdi_padding",
        icon: "mdi mdi-table",
        id: prefix + "_viewdata_btn",
        tooltip: "View data selected tree",
        disabled: true,
        autowidth: true,
        click: function () {
          let profileId = $$(prefix + "_source_combo").getValue();
          const tableOid = $$(prefix + "_db_tree")
            .getSelectedId()
            .split("_")[0];
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
                      "<span class='mdi mdi-star-outline webix_icon'></span>Add Bookmark",
                  });
                  arr.push({
                    id: prefix + "_all_bookmark",
                    value: "<span class='webix_icon'></span>All Bookmark",
                  });
                  arr.push({
                    id: prefix + "_manage_bookmark",
                    value: "<span class='webix_icon'></span>Manage Bookmark",
                  });

                  const _data = r.json().data;
                  if (_data.length > 0) {
                    arr.push({ $template: "Separator" });
                    this.config.width = 300;
                  } else {
                    this.config.width = 150;
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
                  user_id: userId,
                  type: 4,
                };
                webix
                  .ajax()
                  .headers(defaultHeader())
                  .post(urlProfile + "/content", data);
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
          body: {
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
                .headers(defaultHeader())
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
                    }
                    $$(prefix + "_history_toggle").setValue(false);
                    $$(prefix + "_dbconn_toggle").setValue(false);
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
                    webix.message("No record found");
                  }
                  pageId.hideProgress();
                  pageId.enable();
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
                searchState = id;
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
    view: "tree",
    width: 250,
    id: prefix + "_db_tree",
    css: "z_db_tree",
    // type:"lineTree",
    hidden: true,
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
        // console.log('obj', obj)
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
        if (suffix == "g")
          return `<span class='webix_icon mdi mdi-script-outline z_tree_g_open'></span>`;
        return "<span class='webix_icon mdi mdi-radiobox-blank'></span>";
      },
    },
    // template:"{common.icon()}&nbsp;#value#",
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
        // console.log("itemx", itemx);
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
        if (id.split("_")[1] == "u") {
          return true;
        } else {
          // return false;
          return webix.html.preventEvent(e);
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
          data: [
            { id: "view_data_all", value: "View Data All Rows" },
            { id: "view_data_last100", value: "View Data Last 100" },
          ],
          on: {
            onItemClick: function (id) {
              let profileId = $$(prefix + "_source_combo").getValue();
              const tableOid = _this.getSelectedId().split("_")[0];
              if (id == "view_data_all") {
                runViewData(profileId, tableOid);
              } else if (id == "view_data_last100") {
                runViewData(profileId, tableOid, 1);
              }
            },
          },
        });
        ctxMenu.attachTo(this);
      }),
    },
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
                  // copyToQuery(
                  //   document.getElementById(prefix + "_result_history")
                  //     .innerHTML
                  // );
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
                  copyToClipboard($$(prefix + "_history_content").getValue());
                },
              },
            ],
          },
          {},
        ],
      },
      // {
      //   view: "template",
      //   id: prefix + "_history_content",
      //   css: "z_out_template",
      //   scroll: "xy",
      //   template: "test",
      // },
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
            // readOnly: true,
          },
        ],
      },
    ],
  };

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
            template:
              "#value# <span style='float:right;width:50px;line-height:1.3' class='run_button z_multi_conn_icon webix_button webix_icon mdi mdi-play hover_only'></span>",
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
                on: {
                  onTimedKeyPress: function () {
                    // $$(prefix + "_history_list").filterByAll();
                    const value = this.getValue().toLowerCase();
                    $$(prefix + "_history_list").filter(function (obj) {
                      return obj.content.toLowerCase().indexOf(value) !== -1;
                    });
                  },
                },
              },
              {
                view: "icon",
                icon: "mdi mdi-delete-sweep-outline",
                tooltip: "Clear all History",
                click: function () {
                  console.log("clear");
                },
              },
            ],
          },
          {
            view: "list",
            id: prefix + "_history_list",
            css: "z_fade_list z_list_cursor_pointer",
            template: function (obj) {
              if (obj.content) {
                return `${truncateString(
                  obj.content,
                  40
                )} <span style='color: grey;font-style:italic;font-size:13;float:right;'>
                ${timeAgo.format(new Date(obj.created_at), "mini")}</span>`;
              }
            },
            select: true,
            headerRowHeight: 0,
            url: `${urlProfile}/content?type=3`,
            on: {
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
            // console.log(`sel`, sel.row);
            loadSchemaContent(0, sel.row);
          },
        },
      },
    ],
  };

  const runViewData = (profileId, tableOid, type) => {
    webix
      .ajax()
      .headers(defaultHeader())
      .get(`${url}/table_name?id=${profileId}&&oid=${tableOid}`)
      .then((r) => {
        const rData = r.json();
        let optionSql = "";
        if (type == 1) {
          optionSql = `ORDER BY id DESC LIMIT 100`;
        }
        let sql = `SELECT * FROM ${rData.tableschema}.${rData.tablename} ${optionSql}`;
        $$(prefix + "_sql_editor").setValue(sql);
        runQuery($$(prefix + "_source_combo").getValue());
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
              view: "list",
              width: 250,
              drag: "order",
              template: "#title#",
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
              },
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
                          user_id: userId,
                          type: 4,
                        };
                        const listId = $$(prefix + "_bm_list");
                        const id = listId.getSelectedId();

                        webix
                          .ajax()
                          .headers(defaultHeader())
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
                          .headers(defaultHeader())
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
    webix.extend(panelId, webix.OverlayBox);
    panelId.showOverlay(
      "<div style='height:100%;background:#e3e3e373'>&nbsp;</div>"
    );
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
            );
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
            loadSchemaContent(0, node.id);
            $$(prefix + "_search_detach_win").close();
            panelId.hideOverlay();
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
    };

    webix
      .ui({
        view: "fadeInWindow",
        head: false,
        body: {
          padding: 2,
          cols: [search],
        },
        id: prefix + "_search_detach_win",
        move: true,
        padding: 10,
        top: 100,
        left: $$(prefix + "_page_panel").$width / 2 - sidemenuWidth / 2,
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
                  webix.storage.local.put(LAST_SEARCHTYPE, newVal);
                  webix
                    .confirm({
                      title: "Change Search Style",
                      ok: "Yes, reload",
                      cancel: "Later",
                      text: "Need reload this page to apply changes",
                    })
                    .then(function () {
                      setInterval(() => location.reload(), 1000);
                    })
                    .fail(function () {});
                },
              },
            },
            { template: "" },
          ],
        },
        on: {
          onShow: function () {
            $$(prefix + "_show_data_type").blockEvent();
            $$(prefix + "_detach_quick_search").blockEvent();
            const ck = webix.storage.local.get(LAST_DATATYPE);
            if (ck) {
              $$(prefix + "_show_data_type").setValue(ck);
            }
            const st = webix.storage.local.get(LAST_SEARCHTYPE);
            if (st) {
              $$(prefix + "_detach_quick_search").setValue(st);
            }
            $$(prefix + "_show_data_type").unblockEvent();
            $$(prefix + "_detach_quick_search").unblockEvent();
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
        openWinCell(content);
      }

      if ((type == "text" || type == "varchar") && content.length > 100) {
        openWinCell(content);
      }

      function openWinCell(content) {
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
                { view: "label", label: "Detail Cell" },
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
            body: {
              view: "textarea",
              css: "z_query_detail_cell",
              value: content,
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
      treeId.load(`${urlDb}?id=${srcId}&t=1`);
    }
  };

  const loadBranch = (viewId, id, isContext) => {
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
        // .headers(defaultHeader())
        .get(`${urlDb}/schema?id=${profileId}&root=${rootroot}&parent=${id}`)
        .then(function (data) {
          // console.log("tree", tree);
          var item = tree.getItem(id);
          // console.log("item///////////////////", item);
          setTimeout(() => {
            if (item.$count <= 0) {
              item.open = false;
              tree.refresh(id);
            }
          }, 600);
          return (data = data.json());
        })
    );
  };

  const runQuery = (inputSourceId) => {
    // let url = `${urlDb}_query`;
    const editorId = $$(prefix + "_sql_editor");

    const getEditor = editorId.getEditor();
    const selectionText = getEditor.getSelection();
    const ed = getEditor.getModel().getValueInRange(selectionText);

    let selectionLineNo = 0;
    let isSelection = false;

    // return;
    let sqlInput = "";
    if (ed.length > 0) {
      isSelection = true;
      sqlInput = ed;
      selectionLineNo = selectionText.positionLineNumber;
    } else {
      sqlInput = editorId.getValue();
    }

    // const dType = state.isDataType || webix.storage.local.get(LAST_DATATYPE);

    let input = {
      source_id: inputSourceId,
      sql: sqlInput,
      dtype: state.isDataType,
    };
    const sourceCmb = $$(prefix + "_source_combo").getValue();

    if (input.sql != "" && sourceCmb) {
      let start_time = new Date().getTime();
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
        .headers(defaultHeader())
        .post(url + "/run", input)
        .then((r) => {
          let rData = r.json();

          let newArr;

          if (!rData.error) {
            newArr = rData.data.map((elm) => {
              if (elm.hasOwnProperty("id")) {
                elm.id += "<i style='color:white;'>__" + webix.uid() + "</i>";
              }
              return elm;
            });
          }

          // console.log(`rData.config`, rData.config)
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
                      // {
                      //   value: "Console",
                      //   id: prefix + "_console",
                      //   width: 150,
                      // },
                      {
                        //   value: "Console2",
                        //   id: prefix + "_result_console",
                        //   width: 150,
                        // },
                        value: "Console",
                        id: prefix + "_console",
                        width: 150,
                      },
                    ],
                    on: {
                      onChange: function (v) {
                        if (v == prefix + "_console") {
                          $$(prefix + "_copy_result_clipboard").show();
                        } else {
                          $$(prefix + "_copy_result_clipboard").hide();
                        }
                      },
                    },
                  },
                  {
                    view: "icon",
                    icon: "mdi mdi-content-copy",
                    autowidth: true,
                    id: prefix + "_copy_result_clipboard",
                    tooltip: "Copy result to clipboard",
                    click: function () {
                      const content = $$(prefix + "_console").getValue();
                      const val = content.split("--notice:--")[1];
                      if (typeof val != "undefined") {
                        copyToClipboard(val);
                      } else {
                        webix.message({
                          text: "No content to copy",
                          type: "debug",
                        });
                      }
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
                    columns: rData.config,
                    resizeColumn: true,
                    // data: rData.data,
                    data: newArr,
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
                      },
                      onItemClick: function (id, e, trg) {
                        const cols = this.config.columns;
                        const type = cols.find((o) => o.id == id.column).ztype;
                        const sel = this.getItem(id);
                        openDetailCell(type, sel[id.column]);
                      },
                    },
                  },
                  // {
                  //   view: "template",
                  //   scroll: "xy",
                  //   css: "z_out_template",
                  //   id: prefix + "_console",
                  //   template: function (obj) {
                  //     return "";
                  //   },
                  // },
                  {
                    view: "monaco-editor",
                    // id: prefix + "_result_console",
                    css: "z_console_editor",
                    id: prefix + "_console",
                    language: "text",
                    lineNumbers: "off",
                    fontSize: "12px",
                    borderless: true,
                    // css: {
                    //   "padding-top":"10px"
                    // },
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
            // console.log(`onerror>>>>>>>>>>>>>>>>>>>>>>>>>`);
            $$(prefix + "_scrollview_body").addView(newView);
            if (typeof rData.message != "undefined") {
              // $$(prefix + "_console").setHTML(
              //   "<pre id='query_result_message'>" + rData.message + "</pre>"
              // );
              // $$(prefix + "_result_console").setValue(rData.message);
              $$(prefix + "_console").setValue(rData.message);
            }
            if (rData.total_count > 0 || rData.data.length > 0) {
              $$(prefix + "_tabbar").setValue(prefix + "_result");
            } else {
              $$(prefix + "_tabbar").setValue(prefix + "_console");
            }

            lineNo = 0;
          } else {
            $$(prefix + "_scrollview_body").addView(newView);
            let output = rData.error;
            const arr = output.match(/errline:(.*)/);

            if (arr != null) {
              lineNo = Number(arr[1]);

              if (lineNo > 0) {
                const getEditorId = $$(prefix + "_sql_editor").getEditor();
                getEditorId.revealLineInCenter(lineNo);

                lineNo = isSelection ? lineNo + selectionLineNo - 1 : lineNo;

                getEditorId.setPosition({ lineNumber: lineNo, column: 1 });

                // reset decoration
                decorations.forEach((el, i) => {
                  const targetId = decorations[i];
                  getEditorId.deltaDecorations([targetId], []);
                });

                // https://snippet.webix.com/prqn82na
                let deco = getEditorId.deltaDecorations(
                  [],
                  [
                    {
                      range: new monaco.Range(lineNo, 0, lineNo, 0),
                      options: {
                        isWholeLine: true,
                        // className: 'myContentClass',
                        glyphMarginClassName: "myGlyphMarginClass",
                        linesDecorationsClassName: "breakpointStyle",
                        marginClassName: "rightLineDecoration",
                        inlineClassName: "problematicCodeLine",
                      },
                    },
                  ]
                );

                decorations.push(deco);
              }
            }

            // $$(prefix + "_console").setHTML(
            //   "<pre>" +
            //     output.charAt(0).toUpperCase() +
            //     output.slice(1) +
            //     "</pre>"
            // );
            $$(prefix + "_console").setValue(
              output.charAt(0).toUpperCase() + output.slice(1)
            );
            $$(prefix + "_tabbar").setValue(prefix + "_console");
          }

          if (lineNo == 0) {
            $$(prefix + "_sql_editor")
              .getEditor(true)
              .then((ed) => {
                // const targetId = decorations[0];
                decorations.forEach((el, i) => {
                  console.log(decorations);
                  const targetId = decorations[i];
                  ed.deltaDecorations([targetId], []);
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

  function loadHistory() {
    let listId = $$(prefix + "_history_list");
    listId.clearAll();
    listId.load(`${urlProfile}/content?type=3`);
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
        }),
        editor.addAction({
          id: "search-focus",
          label: "Search focus cursor",
          keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_P],
          precondition: null,
          keybindingContext: null,
          contextMenuGroupId: "navigation",
          contextMenuOrder: 1.5,
          run: function (ed) {
            // $$(prefix + "_database_search_cmb").focus();
            $$(prefix + "_database_search").focus();
            return null;
          },
        });
    });
  };

  const loadSchemaContent = (itemRootId, oid) => {
    const pre = oid.split("_")[1];
    if (pre == "g" || pre == "u") {
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
        });
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
                view: "monaco-editor",
                id: prefix + "_sql_editor",
                language: "sql",
                // fontSize: "16px",
                //borderless: true,
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
        initQueryEditor();

        if (sType) {
          $$(prefix + "_database_search").hide();
          $$(prefix + "_database_search_content").hide();
          $$(prefix + "_search_more_btn").hide();
          $$(prefix + "_search_detach_btn").show();

          webix.UIManager.addHotKey("Esc", function () {
            if ($$(prefix + "_search_detach_win")) {
              const panelId = $$(prefix + "_page_panel");
              panelId.hideOverlay();
              $$(prefix + "_search_detach_win").hide();
            }
          });
        } else {
          if ($$(prefix + "_database_search").isVisible()) {
            $$(prefix + "_database_search_content").hide();
            $$(prefix + "_database_search").show();
          } else {
            $$(prefix + "_database_search_content").show();
            $$(prefix + "_database_search").hide();
          }
          $$(prefix + "_search_detach_btn").hide();
        }
        webix.UIManager.addHotKey("Ctrl+;", function () {
          if (sType) {
            openSearchDetach();
          } else {
            $$(prefix + "_database_search").focus();
            $$(prefix + "_database_search")
              .getInputNode()
              .select();
          }
        });
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
