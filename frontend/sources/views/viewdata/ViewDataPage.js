import { url as urlProfile } from "../../models/Profile";
import { state as stateBase } from "../../models/Base";
import { url as urlDb } from "../../models/Db";
import { url, state } from "../../models/ViewData";
import { LAST_DB_CONN_VIEWDATA } from "../../config/setting";
import { defaultHeader } from "../../helpers/api";


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
      // .get(`${url}/data?id=${profileId}&&oid=${oidReal}`)
      .get(currUrl)
      .then(function (data) {
        // console.log(`data`, data);
        viewId.hideProgress();
        // viewId.setValue(data.json().data);
        const rData = data.json();
        // console.log(`rDdata-config`, rData.config);
        // console.log(`rDdata-data`, rData.data);

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
            update: function (id, operation, update) {
              let inputData = {
                data: update,
                oid: rData.tbl_oid,
                source_id: profileId,
              };
              return webix.ajax().post(`${url}/update`, inputData);
            },
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
          },
        };

        // var processor = webix.dp($$(prefix + "_table"));
        // console.log(`dp`, processor)
        // dp.attachEvent("onBeforeDataSend", function(send){
        //   send.data.some = 123;
        // });

        $$(prefix + "_table_panel").addView(newView);
        $$(prefix + "_refresh").show();
        $$(prefix + "_add_row").show();
      }).fail(function(err) {
        const errData = JSON.parse(err.response);
        webix.message({text: errData.message, type: "error"});
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
            .headers(defaultHeader())
            .del(`${url}/remove`, null, function (res) {
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
          newViewDataTab()
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
        options: {
          url: `${urlProfile}/content?type=2&ls=true`,
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
