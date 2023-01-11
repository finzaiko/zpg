import { JetView } from "webix-jet";
import { url, state } from "../../models/Compare";
import { url as urlProfile } from "../../models/Profile";
import { userProfile } from "../../models/UserProfile";
import { setEditorFontSize, showError } from "../../helpers/ui";
import { CompareHelp } from "./CompareHelp";
import { url as urlTask, urlItem as urlTaskItem } from "../../models/Task";
import { url as urlQuery } from "../../models/Query";

import { defaultHeader } from "../../helpers/api";
import { CONFIRM_DROP_REPLACE, CONFIRM_EXECUTE } from "../../config/setting";

const prefix = state.prefix;

let storeDiffSQL = new webix.DataCollection();
let tableDragEvent;
const defenitionColumn = [
  {
    id: "err",
    // header: "",
    header: ["", { content: "textFilter" }],
    adjust: true,
    cssFormat: function (value, config) {
      if (value == "trg") return "z-cell-trg";
      if (value == "src") return "z-cell-src";
      if (value == "dif") return "z-cell-diff";
    },
  },
  {
    id: "z_schema",
    header: ["Schema", { content: "textFilter" }],
    adjust: true,
  },
  {
    id: "z_name",
    header: ["Name", { content: "textFilter" }],
    adjust: true,
  },
  {
    id: "z_type",
    header: ["Type", { content: "textFilter" }],
    adjust: true,
  },
  {
    id: "z_return",
    header: ["Return", { content: "textFilter" }],
    adjust: true,
  },
  // { id: "z_content", header: "Content Length", adjust: true },
];

const contentColumn = [
  {
    id: "err",
    header: ["", { content: "textFilter" }],
    adjust: true,
    cssFormat: function (value, config) {
      if (value == "trg") return "z-cell-trg";
      if (value == "src") return "z-cell-src";
      if (value == "dif") return "z-cell-diff";
    },
  },
  {
    id: "z_schema",
    header: ["Schema", { content: "textFilter" }],
    adjust: true,
  },
  {
    id: "z_name",
    header: ["Name", { content: "textFilter" }],
    adjust: true,
  },
  {
    id: "val_a",
    header: ["Source", { content: "textFilter" }],
    adjust: true,
  },
  {
    id: "val_b",
    header: ["Target", { content: "textFilter" }],
    adjust: true,
  },
];

const toolbar = {
  view: "toolbar",
  // id: "difftb",
  elements: [
    {
      view: "combo",
      id: "typecompare",
      placeholder: "Type",
      width: 100,
      value: 1,
      options: [
        { id: 1, value: "defenition" },
        { id: 2, value: "content" },
      ],
      on: {
        onChange: function (id, val) {
          if (id == 1) {
            $$("diff_filter").show();
            $$("griddiff").config.columns = defenitionColumn;
          } else {
            $$("diff_filter").hide();
            $$("griddiff").config.columns = contentColumn;
            // $$("griddiff").attachEvent("onBeforeDrag",function(){
            //   return false;
            // });
          }
          $$("griddiff").refreshColumns();
          setTimeout(() => reset(), 800);
        },
      },
    },
    {
      view: "combo",
      id: "diffsourcecombo",
      placeholder: "Source DB",
      width: 200,
      options: {
        url: `${urlProfile}/content?type=2&ls=true`,
        on: {
          onBeforeShow: function () {
            reloaCombo(
              $$("diffsourcecombo"),
              `${urlProfile}/content?type=2&ls=true`
            );
          },
        },
      },
      on: {
        onChange: function (id, val) {
          const sCmb = $$("diffsourcecombo").getValue();
          const tCmb = $$("difftargetcombo").getValue();

          if (sCmb && tCmb && sCmb != tCmb) {
            $$("diff_swap_btn").enable();
            $$("diff_compare_btn").enable();
          } else {
            $$("diff_swap_btn").disable();
            $$("diff_compare_btn").disable();
          }
        },
      },
    },
    {
      view: "button",
      id: "diff_swap_btn",
      type: "icon",
      icon: "mdi mdi-swap-horizontal",
      css: "win_btn",
      tooltip: "Swap database connection",
      autowidth: true,
      disabled: true,
      click: function () {
        const a = $$("diffsourcecombo").getValue();
        const b = $$("difftargetcombo").getValue();

        if (a && b) {
          $$("difftargetcombo").setValue(a);
          $$("diffsourcecombo").setValue(b);
        }
      },
    },
    {
      view: "combo",
      id: "difftargetcombo",
      width: 200,
      placeholder: "Target DB",
      options: {
        url: `${urlProfile}/content?type=2&ls=true`,
        on: {
          onBeforeShow: function () {
            reloaCombo(
              $$("difftargetcombo"),
              `${urlProfile}/content?type=2&ls=true`
            );
          },
        },
      },
      on: {
        onChange: function (id, val) {
          filterSchema($$("diffsourcecombo").getValue());

          const sCmb = $$("diffsourcecombo").getValue();
          const tCmb = $$("difftargetcombo").getValue();

          if (sCmb && tCmb && sCmb != tCmb) {
            $$("diff_swap_btn").enable();
            $$("diff_compare_btn").enable();
          } else {
            $$("diff_swap_btn").disable();
            $$("diff_compare_btn").disable();
          }
        },
      },
    },
    {
      view: "combo",
      placeholder: "Schema",
      width: 200,
      id: "diffschemalist",
      options: {},
    },
    {
      view: "combo",
      placeholder: "Filter",
      width: 150,
      id: "diff_filter",
      value: 2,
      options: [
        { id: 1, value: "Tables" },
        { id: 2, value: "Functions" },
        { id: 3, value: "Table, Functions" },
      ],
    },
    {
      view: "button",
      type: "icon",
      icon: "mdi mdi-play",
      tooltip: "Compare",
      css: "zmdi_padding",
      id: "diff_compare_btn",
      autowidth: true,
      disabled: true,
      click: function () {
        compare();
      },
    },
    {
      view: "button",
      type: "icon",
      icon: "mdi mdi-close-box",
      tooltip: "Reset",
      css: "zmdi_padding",
      id: "diff_reset",
      autowidth: true,
      hidden: true,
      click: function () {
        reset();
      },
    },
    {
      view: "button",
      type: "icon",
      icon: "mdi mdi-dots-vertical",
      tooltip: "More options",
      css: "zmdi_padding",
      id: "diff_moreoptions_btn",
      autowidth: true,
      hidden: true,
      popup: {
        view: "contextmenu",
        data: [
          { id: 1, value: "Add to new Task" },
          { id: 2, value: "Add to existing Task" },
        ],
        submenuConfig: {
          width: 150,
        },
        on: {
          onMenuItemClick: function (id) {
            $$("griddiff").define("multiselect", "touch");
            $$("griddiff").detachEvent(tableDragEvent);
            tableDragEvent = $$("griddiff").attachEvent(
              "onBeforeDrag",
              function () {
                return true;
              }
            );
            if (id == 1) {
              $$("diff_detail_panel").hide();
              $$("diff_detail_resizer").show();
              $$("diff_newtask_panel").show();
            } else if (id == 2) {
            }
          },
        },
      },
    },
    {
      view: "combo",
      placeholder: "filter",
      id: "differrfilter",
      hidden: true,
      width: 100,
      options: ["all", "error", "dif", "trg", "src"],
      on: {
        onChange: function (id, val) {
          var value = this.getValue().toLowerCase(); // input data is derived
          if (value == "error") {
            $$("griddiff").filter("#diff#", 1);
          } else if (value == "dif" || value == "trg" || value == "src") {
            $$("griddiff").filter("#err#", value);
          } else {
            $$("griddiff").eachColumn(function (id, col) {
              var filter = this.getFilter(id);
              if (filter) {
                if (filter.setValue) filter.setValue("");
                else filter.value = "";
              }
            });
            $$("griddiff").filterByAll();
          }
        },
      },
    },
    {},
    {
      view: "icon",
      icon: "mdi mdi-help-circle-outline",
      id: "diff_help_btn",
      tooltip: "Show help, legend, shortcut",
      autowidth: true,
      click: function () {
        this.$scope.ui(CompareHelp).show();
      },
    },
  ],
};

const toolbarTask = {
  view: "toolbar",
  elements: [
    {
      view: "text",
      label: "Task Name",
      id: "diff_taskname_input",
    },
    {
      view: "button",
      type: "icon",
      id: "diff_savetask_btn",
      icon: "mdi mdi-content-save-outline",
      autowidth: true,
      tooltip: "Save Task",
      hidden: true,
      click: function () {
        saveTaskNew();
      },
    },
    {},
    {
      view: "icon",
      icon: "mdi mdi-close",
      click: function () {
        $$("diff_newtask_panel").hide();
        $$("diff_detail_panel").show();
      },
    },
  ],
};

const selectedList = {
  view: "datatable",
  id: prefix + "_selected_table",
  resizeColumn: true,
  scrollX: true,
  select: "multiselect",
  multiselect: "touch",
  drag: true,
  columns: [
    {
      id: "z_schema",
      header: ["Schema", { content: "textFilter" }],
      sort: "string",
    },
    {
      id: "z_name",
      header: ["Name", { content: "textFilter" }],
      fillspace: true,
      sort: "string",
    },
    { id: "z_type", header: "Type", adjust: true },
  ],
  on: {
    onItemClick: function () {
      // $$(prefix + "_delete_item_btn").show();
    },
    onAfterDrop: function (context, native_event) {
      if (this.count() > 0) {
        $$("diff_savetask_btn").show();
      } else {
        $$("diff_savetask_btn").hide();
      }
      // updateTask();
    },
    onBeforeLoad: function () {
      this.showOverlay("Loading...");
    },
    onAfterLoad: function () {
      this.hideOverlay();
    },
  },
};

function reloaCombo(comboId, url) {
  var cmbList = comboId.getPopup().getList();
  cmbList.clearAll();
  comboId.setValue("");
  comboId.getPopup().getList().unselect();
  cmbList.load(url);
}

function saveTaskNew() {
  const taksInputId = $$("diff_taskname_input");
  const taskName = taksInputId.getValue();
  if (taskName.trim() == "") {
    webix.html.addCss(taksInputId.getNode(), "webix_invalid");
    webix.message({ text: "Task name can not empty", type: "error" });
  } else {
    webix.html.removeCss(taksInputId.$view, "webix_invalid");

    const data = {
      task_name: taskName,
      user_id: userProfile.userId,
    };
    webix
      .ajax()

      .post(urlTask, data, function (res) {
        const dataRes = JSON.parse(res);
        saveTaskItem(dataRes.data.last_id);
      })
      .fail(function (err) {
        webix.message({ text: err.responseText, type: "error" });
      });
  }
}

function saveTaskItem(id) {
  let itemData = $$(prefix + "_selected_table").serialize();
  let data = {
    task_id: id,
    source_db_id: $$("diffsourcecombo").getValue(),
    oid_arr: itemData.map((v) => v.id_a).join(","),
  };

  webix
    .ajax()

    .post(urlTaskItem + "/selected", data, function (res) {
      webix.message({
        text: "Task success saved, please to Task to see detail",
        type: "success",
      });
      $$("diff_newtask_panel").hide();
      $$("diff_detail_panel").show();
    })
    .fail(function (err) {
      webix.message({ text: err.responseText, type: "error" });
    });
}

function reset() {
  $$("difftargetcombo").setValue();
  $$("diffsourcecombo").setValue();
  $$("diffschemalist").setValue();
  $$("diff_filter").setValue(1);
  $$("differrfilter").setValue("all");
  $$("griddiff").clearAll();
  $$("differrfilter").hide();
  $$("diff_moreoptions_btn").hide();
  $$("diff_config_info_lbl").setValue();
  if ($$("diff_detail_panel")) {
    webix.extend($$("diff_detail_panel"), webix.OverlayBox);
    $$("diff_detail_panel").hideOverlay();
  }
  $$("diff_detail_resizer").hide();
  $$("diff_detail_panel").hide();
  $$("diff_reset").hide();
}

function filterSchema(id) {
  var cmbId = $$("diffschemalist");
  var filterCombo = cmbId.getPopup().getList();
  filterCombo.clearAll();
  cmbId.setValue("");
  cmbId.getPopup().getList().unselect();
  filterCombo.load(`${url}/schema?id=${id}`);
}

function compare() {
  $$("griddiff").define("multiselect", false);

  // $$("griddiff").detachEvent(tableDragEvent);
  tableDragEvent = $$("griddiff").attachEvent("onBeforeDrag", function () {
    return false;
  });

  const srcId = $$("diffsourcecombo").getValue();
  const tarId = $$("difftargetcombo").getValue();
  const scmId = $$("diffschemalist").getValue();
  const diffFilter = $$("diff_filter").getValue();
  const itemSrc = $$("diffsourcecombo").getPopup().getList().getItem(srcId);
  const itemTar = $$("difftargetcombo").getPopup().getList().getItem(tarId);
  $$("diff_config_info_lbl").setValue(
    `Source: ${itemSrc.host}/${itemSrc.database} &nbsp;&nbsp;&nbsp; Target: ${itemTar.host}/${itemTar.database}`
  );

  $$("griddiff").clearAll();
  $$("differrfilter").setValue("all");

  let routePath = "generate";
  if ($$("typecompare").getValue() == 2) {
    routePath = "generate_rowcount";
  }
  const _url = `${url}/${routePath}?source_id=${srcId}&target_id=${tarId}&schema=${scmId}&filter=${diffFilter}`;
  const pageId = $$("z_compare_page");

  webix.extend(pageId, webix.ProgressBar);
  pageId.showProgress({
    type: "icon",
    icon: "mdi mdi-loading z_mdi_loader",
  });
  pageId.disable();

  const diffPanelId = $$("diff_detail_panel");
  webix
    .ajax(_url)
    .then(function (rb) {
      const _url2 = `${url}/result`;
      webix.ajax(_url2).then((rc) => {
        const res = rc.json();
        if (typeof res.data == "undefined") {
          webix.alert({
            type: "alert-error",
            title: "Comparing Failed",
            text: "Problem accured when not show comparing result, please try again.",
          });
          pageId.hideProgress();
          pageId.enable();
        } else {
          pageId.hideProgress();
          pageId.enable();
          $$("griddiff").parse(rc.json());
          webix.extend(diffPanelId, webix.OverlayBox);
          diffPanelId.showOverlay(
            `<div style='background:white;padding-top:0;height:99%; display: flex;justify-content: center;align-items: center; flex-direction: column;margin-top:1px; margin-bottom:1px'>
          <div>Select left table to show the differences</div>
          <div style='font-size: 20px' class='mdi mdi-arrow-left'></div>
          </div>`
          );

          if ($$("griddiff").serialize().length > 0) {
            $$("diff_detail_resizer").show();
            $$("diff_detail_panel").show();
          } else {
            $$("diff_detail_resizer").hide();
            $$("diff_detail_panel").hide();
          }
        }
      });
    })
    .fail(function (err) {
      webix.message({ text: err.responseText, type: "error" });
      diffPanelId.hideOverlay();
      pageId.hideProgress();
      pageId.enable();
    });
}

function showCompareDetail(_this, sel) {
  const item = _this.getItem(sel);
  const srcId = $$("diffsourcecombo").getValue();
  const tarId = $$("difftargetcombo").getValue();
  const diffPanelId = $$("diff_detail_panel");

  webix.extend(diffPanelId, webix.ProgressBar);
  diffPanelId.hideOverlay();
  diffPanelId.showProgress({
    type: "icon",
    icon: "mdi mdi-loading z_mdi_loader",
  });
  diffPanelId.disable();
  webix.html.addCss(diffPanelId.getNode(), "z_progress_overlay");

  const _url = `${url}/detail?source_id=${srcId}&target_id=${tarId}&source_oid=${item.id_a}&target_oid=${item.id_b}&z_type=${item.z_type}&schema=${item.z_schema}&name=${item.z_name}&ret=${item.z_return}&prm_in=${item.z_params_in}&prm_out=${item.z_params_out}`;
  $$("diff_all_sql_detail").setDiffValue("", "");

  webix
    .ajax(_url)
    .then((ra) => {
      const data = ra.json().data;
      let objSource = data.source;
      let objTarget = data.target;

      if ($$("diff_is_drop_replace").getValue() == 1) {
        objSource = data.source_dropdef + "\n" + objSource;
        objTarget = data.target_dropdef + "\n" + objTarget;
      }

      storeDiffSQL.parse([
        { id: "source", value: objSource },
        { id: "target", value: objTarget },
      ]);

      $$("diff_all_sql_detail").setDiffValue(objSource, objTarget);
      if (typeof objSource !== "undefined") {
        $$("diff_source_sql_detail").setValue(objSource);
      }
      if (typeof objTarget !== "undefined") {
        $$("diff_target_sql_detail").setValue(objTarget);
      }

      diffPanelId.hideProgress();
      diffPanelId.enable();
    })
    .catch((err) => {
      setTimeout(() => {
        diffPanelId.hideProgress();
        diffPanelId.enable();
        webix.message({ text: "Content not found", type: "error" });
      }, 1000);
    });
}

function showFullscreenDiff(scope, title, objSource, objTarget) {
  scope
    .ui({
      view: "window",
      position: "center",
      fullscreen: true,
      head: {
        cols: [
          { template: title, type: "header", borderless: true },
          { width: 76 },
          {},
          {
            view: "icon",
            icon: "wxi-close",
            tooltip: "Close window",
            click: function () {
              this.getParentView().getParentView().destructor();
            },
          },
        ],
      },
      body: {
        view: "monaco-editor",
        id: "diff_all_sql_detail_full",
        language: "sql",
        readOnly: true,
        diffEditor: true,
      },
      on: {
        onShow: function () {
          const thisId = $$("diff_all_sql_detail_full");
          setEditorFontSize(thisId);
          webix.extend(thisId, webix.ProgressBar);
          thisId.showProgress({
            type: "icon",
            icon: "mdi mdi-loading z_mdi_loader",
          });
          thisId.disable();
          setTimeout(() => {
            thisId.hideProgress();
            thisId.enable();
            $$("diff_all_sql_detail_full").setDiffValue(objSource, objTarget);
          }, 800);
        },
      },
    })
    .show();
}

function execQuery(tranferTo) {
  const isConfirm = $$("diff_is_confirm").getValue();

  if (isConfirm == 1) {
    webix
      .confirm({
        title: `Execute to ${tranferTo == "trg" ? "Target" : "Source"}`,
        ok: "Yes",
        cancel: "No",
        text: `Are you sure execute query?`,
      })
      .then(function () {
        doExecQuery(tranferTo);
      })
      .fail(function () {});
  } else {
    doExecQuery(tranferTo);
  }
}

function doExecQuery(tranferTo) {
  const src = $$("diffsourcecombo").getValue();
  const trg = $$("difftargetcombo").getValue();

  const sqlSrc = $$("diff_source_sql_detail").getValue();
  const sqlTrg = $$("diff_target_sql_detail").getValue();

  const isDropReplace = $$("diff_is_drop_replace").getValue();

  let input = {
    source_id: tranferTo == "trg" ? trg : src,
    sql: tranferTo == "trg" ? sqlSrc : sqlTrg,
    dtype: 0,
    sqltype: "", // f or t, f=function, t=table
    dropreplace: isDropReplace,
  };

  webix.message({ text: "Not implement yet", type: "warning" });

  return;
  webix
    .ajax()

    .post(urlQuery + "/run", input)
    .then((r) => {
      let rData = r.json();
    })
    .fail(function (err) {
    });
}
export default class ComparePage extends JetView {
  config() {
    const toolbarBottom = {
      view: "toolbar",
      elements: [
        {
          view: "label",
          id: "diff_config_info_lbl",
          css: "diff_config_info_lbl",
        },
        {
          view: "button",
          type: "icon",
          css: "zmdi_padding",
          icon: "mdi mdi-download",
          id: "diff_download_btn",
          autowidth: true,
          hidden: true,
          tooltip: "Download differences result",
          click: function () {
            const src = $$("diffsourcecombo").getText();
            const trg = $$("difftargetcombo").getText();
            webix.toExcel($$("griddiff"), {
              filename: `${src.toLowerCase()}__${trg.toLowerCase()}`,
            });
          },
        },
        {
          view: "button",
          value: "Err",
          id: "diff_err_filter_btn",
          autowidth: true,
          hidden: true,
          tooltip: "Filter error differences",
          click: function () {
            $$("differrfilter").setValue("error");
          },
        },
        {
          view: "pager",
          width: 100,
          id: prefix + "_pagerA",
          size: 20000,
          template: function (data, common) {
            return (
              "<span style=float:right;line-height:2;padding-right:8px>Rows: " +
              data.count +
              "</span>"
            );
          },
        },
      ],
    };

    const toolbarDetail = {
      view: "toolbar",
      elements: [
        {
          view: "icon",
          icon: "mdi mdi-fullscreen",
          autowidth: true,
          tooltip: "Fullscreen mode",
          click: function () {
            const objSource = storeDiffSQL.getItem("source").value;
            const objTarget = storeDiffSQL.getItem("target").value;

            const gridId = $$("griddiff");
            const item = gridId.getItem(gridId.getSelectedId());

            const title = `${item.z_type}: ${item.z_schema}.${item.z_name} - ${item.z_return}`;
            showFullscreenDiff(this.$scope, title, objSource, objTarget);
          },
        },
        {
          view: "icon",
          icon: "mdi mdi-transfer-right",
          tooltip: "Execute query to Target",
          autowidth: true,
          click: function () {
            execQuery("trg");
          },
        },
        {
          view: "icon",
          icon: "mdi mdi-transfer-left",
          tooltip: "Execute query to Source",
          autowidth: true,
          click: function () {
            execQuery("scr");
          },
        },
        { width: 20 },
        {
          view: "checkbox",
          name: "is_confirm",
          id: "diff_is_confirm",
          value: 1,
          labelRight: "Confirm Replace",
          labelWidth: 8,
          width: 150,
          on: {
            onChange: function (newVal, oldVal) {
              webix.storage.local.put(CONFIRM_EXECUTE, newVal);
            },
          },
        },
        {
          view: "checkbox",
          name: "is_drop_replace",
          id: "diff_is_drop_replace",
          value: 0,
          labelRight: "Drop and replace",
          labelWidth: 8,
          width: 150,
          on: {
            onChange: function (newVal, oldVal) {
              webix.storage.local.put(CONFIRM_DROP_REPLACE, newVal);
            },
          },
        },
      ],
    };

    return {
      id: "z_compare_page",
      rows: [
        toolbar,
        {
          cols: [
            {
              view: "datatable",
              id: "griddiff",
              select: "row",
              leftSplit: 1,
              pager: prefix + "_pagerA",
              resizeColumn: true,
              scrollX: true,
              select: "multiselect",
              multiselect: "touch",
              drag: true,
              on: {
                onBeforeLoad: function () {
                  // this.showOverlay("<div style='background:yellow;width:100%;height:100%'>lodinggg</div>");
                  webix.extend(this, webix.ProgressBar);
                  this.showProgress();
                },
                onAfterLoad: function () {
                  this.hideProgress();
                  $$("diff_reset").show();
                  if (this.count()) {
                    $$("differrfilter").show();
                    $$("diff_err_filter_btn").show();
                    $$("diff_download_btn").show();
                    $$("diff_moreoptions_btn").show();
                  } else {
                    $$("differrfilter").hide();
                    $$("diff_err_filter_btn").hide();
                    $$("diff_download_btn").hide();
                    $$("diff_moreoptions_btn").hide();
                  }
                },
                onItemClick: function (sel) {
                  showCompareDetail(this, sel);
                },
                onBeforeDrag: function () {
                  // if(!this.config.drag)return false;
                },
              },
              columns: defenitionColumn,
            },
            {
              view: "resizer",
              id: "diff_detail_resizer",
              hidden: true,
            },
            {
              hidden: true,
              gravity: 2,
              id: "diff_detail_panel",
              css: "diff_detail_panel",
              rows: [
                toolbarDetail,
                {
                  cells: [
                    {
                      view: "monaco-editor",
                      id: "diff_all_sql_detail",
                      language: "sql",
                      readOnly: true,
                      diffEditor: true,
                    },
                    {
                      view: "monaco-editor",
                      id: "diff_source_sql_detail",
                      language: "sql",
                      readOnly: true,
                    },
                    {
                      view: "monaco-editor",
                      id: "diff_target_sql_detail",
                      language: "sql",
                      readOnly: true,
                    },
                  ],
                },
                {
                  view: "tabbar",
                  type: "bottom",
                  multiview: true,
                  options: [
                    {
                      value:
                        "<span class='webix_icon fas fa-film'></span><span style='padding-left: 4px'>All</span>",
                      id: "diff_all_sql_detail",
                    },
                    {
                      value:
                        "<span class='webix_icon fas fa-film'></span><span style='padding-left: 4px'>Source</span>",
                      id: "diff_source_sql_detail",
                    },
                    {
                      value:
                        "<span class='webix_icon fas fa-info'></span><span style='padding-left: 1px'>Target</span>",
                      id: "diff_target_sql_detail",
                    },
                  ],
                  height: 30,
                  on: {
                    onAfterTabClick: function (id) {},
                  },
                },
              ],
            },
            {
              hidden: true,
              gravity: 2,
              id: "diff_newtask_panel",
              css: "diff_newtask_panel",
              rows: [
                toolbarTask,
                // {
                //   template: "test"
                // }
                selectedList,
              ],
            },
          ],
        },
        toolbarBottom,
      ],
    };
  }
  ready() {
    $$("diff_swap_btn").disable();
    $$("diff_compare_btn").disable();

    setEditorFontSize($$("diff_all_sql_detail"));
    setEditorFontSize($$("diff_source_sql_detail"));
    setEditorFontSize($$("diff_target_sql_detail"));

    const ce = webix.storage.local.get(CONFIRM_EXECUTE);
    if (ce) {
      $$("diff_is_confirm").setValue(ce);
    }
    const crd = webix.storage.local.get(CONFIRM_DROP_REPLACE);
    if (crd) {
      $$("diff_is_drop_replace").setValue(crd);
    }
  }
}

function syncScroll(phoneFaceId) {
  var face1 = document.getElementById("display1");
  var face2 = document.getElementById("display2");
  if (phoneFaceId == "display1") {
    face2.scrollTop = face1.scrollTop;
    face2.scrollLeft = face1.scrollLeft;
  } else {
    face1.scrollTop = face2.scrollTop;
    face1.scrollLeft = face2.scrollLeft;
  }
}
