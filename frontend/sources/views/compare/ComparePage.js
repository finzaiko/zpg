import { JetView } from "webix-jet";
import { url, state} from "../../models/Compare";
import { url as urlProfile } from "../../models/Profile";
import { setEditorFontSize } from "../../helpers/ui";

const prefix = state.prefix;

let storeDiffSQL = new webix.DataCollection();

const toolbar = {
  view: "toolbar",
  elements: [
    {
      view: "combo",
      id: "diffsourcecombo",
      placeholder: "Source DB",
      width: 200,
      options: {
        url: `${urlProfile}/content?type=2&ls=true`,
        on: {
          onBeforeShow: function () {},
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
          onBeforeShow: function () {},
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
      view: "checkbox",
      id: "diffistable",
      labelRight: "Table",
      labelWidth: 1,
      width: 90,
      checkValue: true,
      uncheckValue: false,
    },
    {
      view: "button",
      id: "diff_compare_btn",
      value: "Compare",
      autowidth: true,
      disabled: true,
      click: function () {
        compare();
      },
    },
    {
      view: "button",
      value: "Reset",
      id: "diff_reset",
      autowidth: true,
      hidden: true,
      click: function () {
        $$("difftargetcombo").setValue();
        $$("diffsourcecombo").setValue();
        $$("diffschemalist").setValue();
        $$("diffistable").setValue(false);
        $$("griddiff").clearAll();
        $$("differrfilter").hide();
        $$("diff_config_info_lbl").setValue();

        const diffPanelId = $$("diff_detail_panel");
        // webix.extend(diffPanelId, webix.OverlayBox);
        diffPanelId.hideOverlay();
        $$("diff_detail_resizer").hide();
        $$("diff_detail_panel").hide();
        this.hide();
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
            $$("griddiff").filter("#diff#", true);
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
  ],
};

function filterSchema(id) {
  var cmbId = $$("diffschemalist");
  var filterCombo = cmbId.getPopup().getList();
  filterCombo.clearAll();
  cmbId.setValue("");
  cmbId.getPopup().getList().unselect();
  filterCombo.load(`${url}/schema?id=${id}`);
}

function compare() {
  const srcId = $$("diffsourcecombo").getValue();
  const tarId = $$("difftargetcombo").getValue();
  const scmId = $$("diffschemalist").getValue();
  const isTable = $$("diffistable").getValue();
  const itemSrc = $$("diffsourcecombo").getPopup().getList().getItem(srcId);
  const itemTar = $$("difftargetcombo").getPopup().getList().getItem(tarId);
  $$("diff_config_info_lbl").setValue(
    `Source: ${itemSrc.host}/${itemSrc.database} &nbsp;&nbsp;&nbsp; Target: ${itemTar.host}/${itemTar.database}`
  );
  $$("griddiff").clearAll();
  const _url = `${url}/diff?source_id=${srcId}&target_id=${tarId}&schema=${scmId}&is_show_table=${isTable}`;
  const pageId = $$("z_compare_page");

  webix.extend(pageId, webix.ProgressBar);
  pageId.showProgress({
    type:"icon",
    icon: "mdi mdi-loading z_mdi_loader"
  });
  pageId.disable();

  webix.ajax(_url).then((ra) => {
    pageId.hideProgress();
    pageId.enable();
    $$("griddiff").parse(ra.json());
    const diffPanelId = $$("diff_detail_panel");
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
    type:"icon",
    icon: "mdi mdi-loading z_mdi_loader"
  });
  diffPanelId.disable();
  webix.html.addCss(diffPanelId.getNode(), "z_progress_overlay");

  const _url = `${url}/detail?source_id=${srcId}&oid=${item.id}&target_id=${tarId}&schema=${item.z_schema}&name=${item.z_name}&ret=${item.z_return}&prm_in=${item.z_params_in}`;
  $$("diff_all_sql_detail").setDiffValue("", "");

  webix.ajax(_url).then((ra) => {
    const data = ra.json().data;
    const objSource = data.source;
    const objTarget = data.target;

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
  }).catch(err=>{
    setTimeout(() => {
      diffPanelId.hideProgress();
      diffPanelId.enable();
      webix.message({text: "Content not found", type: "error"});
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
            type:"icon",
            icon: "mdi mdi-loading z_mdi_loader"
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
export default class ComparePage extends JetView {
  config() {
    const toolbarBottom = {
      view: "toolbar",
      elements: [
        { view: "label", id: "diff_config_info_lbl", css: "diff_config_info_lbl" },
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
          id: prefix+"_pagerA",
          size: 20000,
          template: function (data, common) {
            return "<span style=float:right;line-height:2;padding-right:8px>Rows: " + data.count + "</span>";
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
          icon: "mdi mdi-transfer-left",
          tooltip: "Replace to Target",
          autowidth: true,
        },
        {
          view: "icon",
          icon: "mdi mdi-transfer-right",
          tooltip: "Replace to Target",
          autowidth: true,
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
              pager: prefix+"_pagerA",
              on: {
                onBeforeLoad: function () {
                  webix.extend(this, webix.ProgressBar);
                  this.showProgress();
                },
                onAfterLoad: function () {
                  this.hideProgress();
                  $$("diff_reset").show();
                  if (this.count()) {
                    $$("differrfilter").show();
                    $$("diff_err_filter_btn").show();
                  } else {
                    $$("differrfilter").hide();
                    $$("diff_err_filter_btn").hide();
                  }
                },
                onItemClick: function (sel) {
                  showCompareDetail(this, sel);
                },
              },
              columns: [
                { id: "z_schema", header:["Schema", { content:"textFilter"}], adjust: true },
                { id: "z_name", header:["Name", { content:"textFilter"}], adjust: true },
                { id: "z_type", header:["Type", { content:"textFilter"}], adjust: true },
                { id: "z_return", header:["Return", { content:"textFilter"}], adjust: true },
                {
                  id: "err",
                  header: "",
                  adjust: true,
                  cssFormat: function (value, config) {
                    if (value == "trg") return "z-cell-trg";
                    if (value == "src") return "z-cell-src";
                    if (value == "dif") return "z-cell-diff";
                  },
                },
              ],
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
          ],
        },
        toolbarBottom,
      ],
    };
  }
  ready() {
    $$("diffsourcecombo").setValue(1);
    $$("difftargetcombo").setValue(3);
    $$("diffschemalist").setValue("master");

    $$("diff_swap_btn").disable();
    $$("diff_compare_btn").disable();

    setEditorFontSize($$("diff_all_sql_detail"));
    setEditorFontSize($$("diff_source_sql_detail"));
    setEditorFontSize($$("diff_target_sql_detail"));
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
