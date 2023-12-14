import { url as urlProfile } from "../../models/Profile";
import { state as stateBase } from "../../models/Base";
import { url as urlDb } from "../../models/Db";
import { url, state } from "../../models/ViewData";
import { LAST_DB_CONN_VIEWDATA } from "../../config/setting";
import { defaultHeader } from "../../helpers/api";
import { colorComboDBSource, isColorLight } from "../../helpers/ui";

function newViewDataTab() {
  function isInt(value) {
    var x;
    return isNaN(value) ? !1 : ((x = parseFloat(value)), (0 | x) === x);
  }

  const newViewId = parseInt(stateBase.currentTabViewData) + 1;
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
    header: "View Data " + newViewId,
    id: state.prefix,
    close: true,
    width: 150,
    body: ViewDataPage(state.prefix),
  });

  $$("tabs").getTabbar().setValue(state.prefix);
  stateBase.currentTabViewData++;
}

export function ViewDataPage(prefix, selectedDb) {
  const pageSize = 30;

  let currUrl = "";

  const loadTableData = (oid) => {
    const oidReal = oid.split("_")[0];
    let profileId = $$(prefix + "_source_combo").getValue();
    let viewId = $$(prefix + "_table_panel");
    webix.extend(viewId, webix.ProgressBar);
    viewId.showProgress({
      type: "top",
    });
    currUrl = `${url}/data?id=${profileId}&&oid=${oidReal}`;
    webix
      .ajax()
      .get(currUrl)
      .then(function (data) {
        viewId.hideProgress();
        const rData = data.json();
        let views = $$(prefix + "_table_panel").getChildViews();
        if (views[0]) {
          $$(prefix + "_table_panel").removeView(views[0]);
        }

        let newView = {
          view: "datatable",
          datafetch: pageSize,
          resizeColumn: true,
          id: prefix + "_table",
          columns: rData.config,
          data: rData.data,
          select: "row",
          editable: true,
          ztblOid: rData.tbl_oid,
          save: {
            // "insert":"url",
            // "delete":"url"
            // update: function (id, operation, update) {
            //   let inputData = {
            //     data: update,
            //     oid: rData.tbl_oid,
            //     source_id: profileId,
            //   };
            //   return webix.ajax().post(`${url}/update`, inputData);
            // },
          },
          editaction: "dblclick",
          pager: prefix + "_pagerA",
          url: currUrl,
          on: {
            onBeforeLoad: function () {
              webix.extend(this, webix.ProgressBar);
              this.showProgress({
                type: "top",
              });
            },
            onAfterLoad: function () {
              this.hideProgress();
            },
            onItemClick: function (sel) {
              $$(prefix + "_remove_row").show();
            },
            onAfterEditStop: function (state, editor) {
              // if(state.old != state.value){
              //       this.addRowCss(editor.row, "z_orange_row");
              // }
              if (state.old == state.value) return true;
              if (!this.$values_cache) this.$values_cache = [];

              const r = this.getItem(editor.row);
              let idRow = editor.row;
              let idDb = -1;
              // if (typeof r["id_0"] != "undefined") {
              //   idDb = r["id_0"];
              // }
              idDb = idRow;
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
              $$(prefix + "_save_row").show();
              if(this.$values_cache.length>0){
                $$(prefix + "_save_row").enable();

              }else{
                $$(prefix + "_save_row").disable();
              }
            },
          },
        };

        $$(prefix + "_table_panel").addView(newView);
        $$(prefix + "_refresh").show();
        $$(prefix + "_add_row").show();
      })
      .fail(function (err) {
        const errData = JSON.parse(err.response);
        webix.message({ text: errData.message, type: "error" });
        viewId.hideProgress();
        $$(prefix + "_table").clearAll();
      });
  };

  const removeRow = () => {
    const dt = $$(prefix + "_table");
    const sel = dt.getSelectedId();
    webix.confirm({
      ok: "Yes",
      cancel: "No",
      text: "Are you sure to delete ?",
      callback: function (result) {
        if (result) {
          webix
            .ajax()
            .del(`${url}/remove/${sel}`, null, function (res) {
              console.log('res',res);

              $$(prefix + "_table").remove(sel);
              webix.message({
                text: `Row deleted`,
              });
            });
        }
      },
    });
  };

  let ViewDataToolbar = {
    view: "toolbar",
    css: "z_viewdata_toolbar",
    elements: [
      {
        view: "button",
        type: "icon",
        autowidth: true,
        css: "zmdi_padding",
        tooltip: "Open new View Data",
        icon: "mdi mdi-view-grid-plus",
        click: function () {
          newViewDataTab();
        },
      },
      {
        view: "button",
        type: "icon",
        css: "zmdi_padding",
        id: prefix + "_showhide_db",
        autowidth: true,
        hidden: true,
        tooltip: "Show database content",
        icon: "mdi mdi-forwardburger",
        click: function () {},
      },
      {
        view: "combo",
        id: prefix + "_source_combo",
        placeholder: "Source DB",
        width: 200,
        // options: {
        //   url: `${urlProfile}/content?type=2&ls=true`,
        // },
        options: {
          width: 250,
          fitMaster: false,
          body: {
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
        },
        on: {
          onChange: function (id, val) {
            webix.storage.local.put(LAST_DB_CONN_VIEWDATA, id);
          },
        },
      },
      {
        view: "combo",
        placeholder: "Schema",
        tooltip: "Schema",
        width: 200,
        hidden: true,
        options: ["One", "Two", "Three"],
      },
      {
        view: "combo",
        placeholder: "Table",
        width: 200,
        hidden: true,
        tooltip: "Table",
        options: ["One", "Two", "Three"],
      },
      {
        view: "text",
        css: "search_suggest",
        id: prefix + "_database_search",
        placeholder: "Search..",
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
              if (filtervalue.length < 1) {
                const viewId = $$(prefix + "_database_search");
                webix.extend(viewId, webix.OverlayBox);
                if (viewId) $$(viewId).hideOverlay();
                this.clearAll();
                return;
              }
              this.clearAll();
              this.load(
                `${urlDb}/content_search?id=${sourceId}&root=0&filter[value]=${filtervalue}&view=tbl`
              );
            },
            on: {
              onBeforeLoad: function () {
                const viewId = $$(prefix + "_database_search");
                webix.extend(viewId, webix.OverlayBox);
                if (viewId)
                  viewId.showOverlay(
                    `<span style='display:block;text-align:right;padding-right:10px;height:100%;line-height:1.0; color:orange' class='mdi mdi-circle-slice-8 mdi_pulsate'></span>`
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
              $$(prefix + "_database_search").$values_cache = node;
              loadTableData(node.id);
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
          onTimedKeyPress: function () {
            if(this.getValue().trim().length==0){
              this.$values_cache = null;
            }
          }
        },
      },
      {
        view: "button",
        type: "icon",
        css: "zmdi_padding",
        id: prefix + "_refresh",
        autowidth: true,
        hidden: true,
        tooltip: "Refresh",
        icon: "mdi mdi-sync",
        click: function () {
          const tbl = $$(prefix + "_table");
          if (tbl) {
            tbl.clearAll();
            tbl.load(currUrl);
            $$(prefix + "_remove_row").show();
          }
        },
      },
      // {
      //   view: "button",
      //   type: "icon",
      //   css: "zmdi_padding",
      //   id: prefix + "_save_row",
      //   autowidth: true,
      //   hidden: true,
      //   tooltip: "Apply Save Changes",
      //   icon: "mdi mdi-table-check",
      //   click: function () {

      //   },
      // },
      {
        view: "button",
        type: "icon",
        icon: "mdi mdi-content-save-outline",
        autowidth: true,
        hidden: true,
        id: prefix + "_save_row",
        tooltip: "Save changes",
        disabled: true,
        css: "z_icon_color_primary zmdi_padding",
        click: function () {
          const grid = $$(prefix + "_table");
          grid.editStop();
          let cache = grid.$values_cache;
          if (typeof cache != "undefined") {
            if (cache.length > 0) {
              cache.forEach((o) => {
                grid.removeCellCss(
                  o.id,
                  o.column,
                  "z_changes_cell_result",
                  false
                );
              });
            }

            const uniqueAddedArr = Array.from(new Set(cache.map((a) => a.id)))
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
            const searchViewId = $$(prefix + "_database_search");
            if(searchViewId.getValue().trim().length==0){
              webix.message({text:"Table empty, please search table name", type:"error"});
              return;
            }
            const sourceItem = searchViewId.$values_cache;
            const schemaTable = `${sourceItem.schema}.${sourceItem.name}`;

            if (cache.length > 0) {
              const inputData = {
                source_id: $$(prefix + "_source_combo").getValue(),
                table_name: schemaTable,
                data: JSON.stringify(dataSave),
                real_field: 1
              };

              webix
                .ajax()
                .post(`${url}/save_result`, inputData)
                .then(function (data) {
                  webix.message({
                    text: "Data saved",
                    type: "success",
                  });
                });
              grid.$values_cache = [];
              $$(prefix + "_save_row").hide();
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
      {
        view: "button",
        type: "icon",
        css: "zmdi_padding",
        id: prefix + "_add_row",
        autowidth: true,
        hidden: true,
        tooltip: "Add new row",
        icon: "mdi mdi-table-row-plus-after",
        click: function () {
          $$(prefix + "_table").add({ id: "0" }, 0);
        },
      },
      {
        view: "button",
        type: "icon",
        css: "zmdi_padding",
        id: prefix + "_remove_row",
        autowidth: true,
        hidden: true,
        tooltip: "Remove row",
        icon: "mdi mdi-table-row-remove",
        click: function () {
          removeRow();
        },
      },
      {},
      {
        view: "pager",
        id: prefix + "_pagerA",
        css: "z-pager-aligned",
        size: pageSize,
        template: function (data, common) {
          var start = data.page * data.size,
            end = start + data.size;
          if (end > data.count) end = data.count;
          return (
            "<span class='z-pager-no'>" +
            (start + 1) +
            "-" +
            end +
            " of " +
            data.count +
            "</span> " +
            common.prev() +
            common.next()
          );
        },
      },
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
    ],
  };

  let ViewDataPage = {
    id: prefix + "_page_panel",
    css: "z_viewdata_page_panel",
    rows: [
      {
        rows: [
          ViewDataToolbar,
          {
            id: prefix + "_table_panel",
            rows: [
              {
                id: prefix + "_empty_tmpl",
                template:
                  "<div style='text-align:center;padding-top:200px'>Search or select table to show data..</div>",
              },
            ],
          },
          {
            hidden: true,
            cols: [
              {
                id: prefix + "_list_tbl",
                // hidden: true,
                view: "list",
                width: 250,
                template: "#title#",
                select: true,
                data: [
                  { id: 1, title: "Item 1" },
                  { id: 2, title: "Item 2" },
                  { id: 3, title: "Item 3" },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  let view = {
    id: prefix,
    type: "clean",
    borderless: true,
    rows: [
      {
        type: "clean",
        borderless: true,
        rows: [ViewDataPage],
      },
    ],
    on: {
      onViewShow: function () {
        $$(prefix + "_database_search").focus();
        const db = webix.storage.local.get(LAST_DB_CONN_VIEWDATA);
        if (db) {
          $$(prefix + "_source_combo").setValue(db);
        }
      },
    },
  };

  return view;
}
