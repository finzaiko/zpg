import { JetView } from "webix-jet";
import { state } from "../../models/Database";
import { state as stateBase } from "../../models/Base";
import { url as urlDb } from "../../models/Db";
import { url as urlProfile } from "../../models/Profile";
import { state as stateQuery } from "../../models/Query";
import { QueryPage } from "../query/QueryPage";
import { DatabaseServer } from "./DatabaseServer";
import { LAST_DB_SERVER } from "../../config/setting";
import { setEditorFontSize } from "../../helpers/ui";

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
      on: {
        onChange: function (id, val) {
          loadDb(id);
        },
      },
    },
    {
      view: "button",
      type: "icon",
      autowidth: true,
      icon: "mdi mdi-connection",
      click: function () {
        this.$scope.ui(DatabaseServer).show();
      },
    },
    {
      view: "button",
      type: "icon",
      autowidth: true,
      icon: "mdi mdi-sync",
      click: function () {},
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
      autowidth: true,
      id: prefix + "_copy_content",
      hidden: true,
      icon: "mdi mdi-content-copy",
      click: function () {
        if ($$("database_sql_editor").getValue() != "") {
          copyToClipboard(
            $$("database_sql_editor"),
            $$("database_sql_editor").getValue()
          );
        }
      },
    },

    {
      view: "button",
      type: "icon",
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

function isInt(value) {
  var x;
  return isNaN(value) ? !1 : ((x = parseFloat(value)), (0 | x) === x);
}

function openQueryTab(baseDbName) {
  const newViewId = parseInt(stateBase.currentTab) + 1;
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
  stateBase.currentTab++;
}

function copyToQuery(val) {
  $$("query_sql_editor").setValue(val);
  $$(prefix + "_history_preview").hide();
  $$("query_sql_editor").show();
}

function copyToClipboard2(textToCopy) {
  // navigator clipboard api needs a secure context (https)
  if (navigator.clipboard && window.isSecureContext) {
    // navigator clipboard api method'
    return navigator.clipboard.writeText(textToCopy);
  } else {
    // text area method
    let textArea = document.createElement("textarea");
    textArea.value = textToCopy;
    // make the textarea out of viewport
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    return new Promise((res, rej) => {
      document.execCommand("copy") ? res() : rej();
      textArea.remove();
    });
  }
}

function copyToClipboard(viewId, text) {
  try {
    navigator.clipboard.writeText(text);
    webix.extend(viewId, webix.OverlayBox);
    viewId.showOverlay(
      `<div class="z_overlay"><span class='z_copied_label animate__animated animate__flash'>Copied!</span></div>`
    );
    setTimeout(() => {
      viewId.hideOverlay();
    }, 1000);
  } catch (err) {
    console.error("Failed to copy: ", err);
  }
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

  viewId.parse(
    webix
      .ajax()
      .get(`${urlDb}/schema?id=${profileId}&root=${rootroot}&parent=${id}&t=0`)
      .then(function (data) {
        var item = tree.getItem(id);
        setTimeout(() => {
          if (item.$count <= 0) {
            item.open = false;
            tree.refresh(id);
          }
        }, 600);
        return (data = data.json());
      })
  );
}

function changeComboColors(val) {
  const _this = $$(prefix + "_database_search");
  const getItem = _this.getPopup().getList().getItem(val);
  webix.delay(function () {
    let value = _this.getValue();
    if (value) {
      let item = _this.$view.getElementsByClassName("webix_el_box")[0]
        .childNodes[0];
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
  tblId.load(urlDb + "?id=" + id);
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
              view: "tree",
              width: 250,
              id: prefix + "_db_tree",
              css: "z_db_tree",
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
                  if (suffix == "g")
                    return `<span class='webix_icon mdi mdi-script-outline z_tree_g_open'></span>`;
                  return "<span class='webix_icon mdi mdi-radiobox-blank'></span>";
                },
              },
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
              },
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
      data: [
        {id: "refresh", value: "Refresh"},
        { $template: "Separator" }, 
        {id: "createconn", value: "Create Connection"}
      ],
      on: {
        onItemClick: function (id) {
          if(id=="refresh"){
            loadBranch($$(prefix + "_db_tree"), nodeId, true);
          }else if(id=="createconn"){
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
