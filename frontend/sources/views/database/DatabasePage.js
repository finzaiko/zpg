import { JetView } from "webix-jet";
import { state } from "../../models/Database";
import { state as stateBase } from "../../models/Base";
import { url as urlDb } from "../../models/Db";
import { url as urlProfile } from "../../models/Profile";
import { state as stateQuery } from "../../models/Query";
import { QueryPage } from "../query/QueryPage";
import { DatabaseServer } from "./DatabaseServer";
import { LAST_DB_SERVER } from "../../config/setting";
import { isInt, setEditorFontSize } from "../../helpers/ui";
import { dbTreeType } from "../../helpers/db";
import { copyToClipboard } from "../../helpers/copy";

const prefix = state.prefix;
let baseRootId, nodeId, baseDbName;

const toolbar = {
  view: "toolbar",
  elements: [
    {
      view: "combo",
      id: prefix + "_server",
      placeholder: "Source server",
      width: 150,
      options: {
        url: `${urlProfile}/conn?type=1&ls=true`,
        fitMaster: false,
        width: 200,
      },
      // options: [],
      on: {
        onChange: function (id, val) {
          loadDb(id);
        },
      },
    },
    {
      view: "button",
      type: "icon",
      css: "zmdi_padding",
      autowidth: true,
      icon: "mdi mdi-connection",
      click: function () {
        this.$scope.ui(DatabaseServer).show();
      },
    },
    {
      view: "text",
      css: "search_suggest",
      id: prefix + "_database_search",
      placeholder: "Search..",
      width: 300,
      hidden: true,
      suggest: {
        keyPressTimeout: 500,
        body: {
          // template: '<span class="#css#">#value#</span>',
          dataFeed: function (filtervalue, filter) {
            if (filtervalue.length < 3) {
              const viewId = $$(prefix + "_database_search");
              if (viewId) $$(viewId).hideOverlay();
              this.clearAll();
              return;
            }
            this.clearAll();
            const profileId = $$(prefix + "_server").getValue();
            this.load(
              `${urlDb}/content_search?id=${profileId}&root=${baseRootId}&filter[value]=` +
                filtervalue
            );
          },
          on: {
            onBeforeLoad: function () {
              const viewId = $$(prefix + "_database_search");
              webix.extend(viewId, webix.OverlayBox);
              if (viewId)
                viewId.showOverlay(
                  `<span style='display:block;text-align:right;padding-right:10px;height:100%;line-height:1; color:orange' class='mdi mdi-circle-slice-8 mdi_pulsate'></span>`
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
            // loadSchemaContent(0, node.id);
            loadSchemaContent(baseRootId, node.id);
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
      view: "button",
      type: "icon",
      css: "zmdi_padding",
      autowidth: true,
      id: prefix + "_copy_content",
      hidden: true,
      icon: "mdi mdi-content-copy",
      click: function () {
        if ($$("database_sql_editor").getValue() != "") {
          this.hide();
          const ck = $$(prefix + "_copy_content_done");
          ck.show();
          setTimeout(() => {
            this.show();
            ck.hide();
          }, 1500);

          copyToClipboard($$("database_sql_editor").getValue());
        }
      },
    },
    {
      view: "button",
      autowidth: true,
      hidden: true,
      id: prefix + "_copy_content_done",
      label:
        '<svg class="animated-check" viewBox="0 0 24 24"><path d="M4.1 12.7L9 17.6 20.3 6.3" fill="none"/></svg>',
    },
    {
      view: "button",
      type: "icon",
      css: "zmdi_padding",
      id: prefix + "_send_backward",
      icon: "mdi mdi-arrange-send-backward",
      autowidth: true,
      hidden: true,
      tooltip: "Copy to query editor",
      click: function () {
        const profileId = $$(prefix + "_server").getValue();
        const viewId = $$("database_sql_editor");
        webix.extend(viewId, webix.OverlayBox);
        viewId.showOverlay(`Checking profile..`);
        webix
          .ajax()
          .get(`${urlProfile}/conncheck?id=${profileId}&db=${baseDbName}`)
          .then(function (data) {
            if (data.json().data) {
              viewId.hideOverlay();
              openQueryTab(baseDbName);
            }
          });
      },
    },
  ],
};

function openQueryTab(baseDbName) {
  stateBase.currentTabQuery = parseInt(stateBase.currentTabQuery) + 1;
  const newViewId = parseInt(stateBase.currentTabQuery);
  let str = stateQuery.prefix;

  let strLast = str.substring(str.lastIndexOf("_") + 1, str.length);
  if (!isInt(strLast)) {
    stateQuery.prefix = stateQuery.prefix + "_" + newViewId;
  } else {
    let sto = stateQuery.prefix;
    let stl = sto.substring(0, sto.lastIndexOf("_"));
    stateQuery.prefix = stl + "_" + newViewId;
  }
  stateBase.viewScope.addTab({
    header: "Query " + newViewId,
    id: stateQuery.prefix,
    close: true,
    width: 150,
    body: QueryPage(stateQuery.prefix, baseDbName),
  });

  $$("tabs").getTabbar().setValue(stateQuery.prefix);
  setTimeout(
    () =>
      $$(stateQuery.prefix + "_sql_editor").setValue(
        $$("database_sql_editor").getValue()
      ),
    600
  );
  // stateBase.currentTab++;
}

function loadBranch(viewId, id, isContext) {
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

  const profileId = $$(prefix + "_server").getValue();

  const item = tree.getItem(id);

  // REFRESH ON RIGHT CLICK
  // item.open = true;
  // item.$count = -1;
  // tree.refresh(id);

  // webix.extend(viewId, webix.ProgressBar);
  // viewId.showProgress({
  //   type: "top",
  // });

  document.body.style.cursor = "progress";
  viewId.parse(
    webix
      .ajax()
      .get(`${urlDb}/schema?id=${profileId}&root=${rootroot}&parent=${id}&t=0`)
      .then(function (data) {
        const rData = data.json();
        setTimeout(() => {
          if (item.$count <= 0) {
            item.open = false;
            tree.refresh(id);
            document.body.style.cursor = "default";
          } else {
            const tType = dbTreeType[id.split("_")[1]];
            if (typeof tType != "undefined") {
              const rcd = tree.getItem(id);
              rcd.value = `${tType} (${rData.data.length})`;
              tree.refresh(id);
            }
          }
          // viewId.hideProgress();
        }, 600);
        return (data = rData);
      })
  );
}

function changeComboColors(val) {
  const _this = $$(prefix + "_database_search");
  const getItem = _this.getPopup().getList().getItem(val);
  webix.delay(function () {
    let value = _this.getValue();
    if (value) {
      let item =
        _this.$view.getElementsByClassName("webix_el_box")[0].childNodes[0];
      item.className = getItem.css;
    }
  });
}

function loadSchemaContent(itemRootId, oid) {
  const pre = oid.split("_")[1];
  if (pre == "g" || pre == "u") {
    const profileId = $$(prefix + "_server").getValue();
    const viewId = $$("database_sql_editor");
    webix.extend(viewId, webix.OverlayBox);
    viewId.showOverlay(`Loading...`);
    webix
      .ajax()

      .get(
        `${urlDb}/schema_content?id=${profileId}&root=${itemRootId}&oid=${oid}`
      )
      .then(function (data) {
        viewId.hideOverlay();
        viewId.setValue(data.json().data);
      });
    $$(prefix + "_copy_content").show();
    $$(prefix + "_send_backward").show();
  } else {
    $$(prefix + "_send_backward").hide();
    $$(prefix + "_copy_content").hide();
  }
}

// Exported functions -----------------

export function reloadServerCombo() {
  const cmbId = $$(prefix + "_server");
  var cmbList = cmbId.getPopup().getList();
  cmbList.clearAll();
  cmbId.setValue("");
  cmbId.getPopup().getList().unselect();
  cmbList.load(urlProfile + "/conn?type=1&ls=true");
}

function loadDb(id) {
  const tblId = $$(prefix + "_db_tree");
  tblId.clearAll();
  let reloadIconId = $$(prefix + "_db_tree_filter_reload");
  reloadIconId.config.icon =
    "mdi mdi-refresh-circle spin_mdi_right z_mdi_splin_color";
  reloadIconId.refresh();

  tblId.load(urlDb + "?id=" + id).then((_) => {
    setTimeout(() => {
      reloadIconId.config.icon = "mdi mdi-reload";
      reloadIconId.refresh();
    }, 600);
  });
  webix.storage.local.put(LAST_DB_SERVER, id);
}

export default class DatabasePage extends JetView {
  config() {
    return {
      rows: [
        toolbar,
        {
          cols: [
            {
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
                          $$(prefix + "_db_tree").filter(
                            "#value#",
                            this.getValue()
                          );
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
                        loadDb($$(prefix + "_server").getValue());
                      },
                    },
                  ],
                },
                {
                  view: "tree",
                  width: 250,
                  id: prefix + "_db_tree",
                  css: "z_db_tree",
                  // type:"lineTree",
                  select: true,
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
                          obj.open ? "z_tree_f_open" : ""
                        }'></span>`;
                      if (suffix == "v")
                        return `<span class='webix_icon mdi mdi-file-table-box-multiple-outline ${
                          obj.open ? "z_tree_f_open" : ""
                        }'></span>`;
                      if (suffix == "y")
                        return `<span class='webix_icon mdi mdi-file-table-box-outline ${
                          obj.open ? "z_tree_f_open" : ""
                        }'></span>`;
                      if (suffix == "g" || suffix == "w")
                        return `<span class='webix_icon mdi mdi-script-outline z_tree_g_open'></span>`;
                      return "<span class='webix_icon mdi mdi-radiobox-blank'></span>";
                    },
                  },
                  // template:"{common.icon()}&nbsp;#value#",
                  template:
                    "{common.icon()} {common.my_folder()} <span>#value#</span>",
                  on: {
                    onAfterSelect: function (id) {
                      baseRootId = id;
                      while (this.getParentId(baseRootId)) {
                        baseRootId = this.getParentId(baseRootId);
                      }
                      baseDbName = this.getItem(baseRootId).value;
                      $$(prefix + "_database_search").show();
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
                      // loadSchemaContent(itemRootId, id);
                    },
                    onItemDblClick: function (id) {
                      if (this.isBranchOpen(id)) {
                        this.close(id);
                      } else {
                        this.open(id);
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
                      this.showOverlay(
                        "<div style='margin-top: 20px'>Loading...</div>"
                      );
                    },
                    onAfterLoad: function () {
                      this.hideOverlay();
                    },
                  },
                },
              ],
            },
            {
              view: "resizer",
            },
            {
              view: "monaco-editor",
              id: "database_sql_editor",
              readOnly: true,
            },
          ],
        },
      ],
    };
  }
  init() {
    const ctxMenu = this.ui({
      view: "contextmenu",
      id: "tree_contextmenu",
      data: [],
      on: {
        onBeforeShow: function () {
          this.clearAll();
          let arr = [];
          arr.push({ id: "refresh", value: "Refresh" });
          const a = $$(prefix + "_db_tree");
          if (a.getSelectedId().split("_")[1] == "d") {
            arr.push({ $template: "Separator" });
            arr.push({ id: "createconn", value: "Create Connection" });
          }
          this.parse(arr);
        },
        onItemClick: function (id) {
          if (id == "refresh") {
            loadBranch($$(prefix + "_db_tree"), nodeId, true);
          } else if (id == "createconn") {
            webix.message("Not implement yet");
          }
        },
      },
    });
    ctxMenu.attachTo($$(prefix + "_db_tree"));

    const editorId = $$("database_sql_editor");
    setEditorFontSize(editorId);
  }

  ready() {
    const db = webix.storage.local.get(LAST_DB_SERVER);
    if (db) {
      $$(prefix + "_server").setValue(db);
    }
  }
}
