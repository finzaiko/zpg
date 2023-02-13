import { JetView } from "webix-jet";
import { alphabetArr } from "../../helpers/alphabet";
import { url, state } from "../../models/CopyData";
import { url as urlQuery } from "../../models/Query";
import { url as urlProfile } from "../../models/Profile";

const prefix = state + "_page";

function generateEmptyRow() {
  let columnsName = [],
    dataEmpty = [];

  const panelId = $$(prefix + "_type_source_sheet");
  webix.extend(panelId, webix.OverlayBox);
  panelId.showOverlay(
    `<div class='z_center_middle' style='background:rgba(255,255,255, 0.5); font-size: 14px;'>
      <div><span style='text-decoration: line-through;'>Copy</span> Paste from Spreadsheet here</div>
    </div>`
  );

  const rowCountSel = parseInt($$(prefix + "_row_count").getValue());
  const rowLength = rowCountSel || 100;
  alphabetArr.forEach((o, i) => {
    columnsName.push({ id: "col_" + i, header: o });
  });

  let colsName = [];
  columnsName.forEach((o, i) => {
    colsName.push([o.id, ""]);
  });

  for (let i = 1; i <= rowLength; i++) {
    dataEmpty.push(Object.assign({ id: i }, Object.fromEntries(colsName)));
  }

  const newView = {
    view: "datatable",
    id: prefix + "_source_spredsheet",
    select: "cell",
    multiselect: true,
    blockselect: true,
    clipboard: "block",
    css: "webix_data_border webix_header_border",
    resizeColumn: true,
    resizeRow: true,
    columns: columnsName,
    data: dataEmpty,
    scheme: {
      $init: function (obj) {
        obj.index = this.count();
      },
    },
  };

  const vbodyId = $$(prefix + "_scrollview_body");
  const views = vbodyId.getChildViews();
  if (views[0]) {
    vbodyId.removeView(views[0]);
  }
  vbodyId.addView(newView);
  setTimeout(() => panelId.hideOverlay(), 1000);
}

function execQueryType() {
  const bodyData = $$(prefix + "_source_query_result").serialize();
  console.log("data", bodyData);

  const targetDbId = $$(prefix + "_target_db");
  const sourceDbId = $$(prefix + "_source_db");
  const schemaTblId = $$(prefix + "_schema_table");
  const firstRowId = $$(prefix + "_first_row_column");
  const typeCopy = $$(prefix + "_source_type").getValue();

  const inputData = {
    type_copy: typeCopy,
    source_id: sourceDbId.getValue(),
    target_id: targetDbId.getValue(),
    table_name: schemaTblId.getValue(),
    data: JSON.stringify(bodyData),
    first_row: firstRowId.getValue(),
  };

  if (inputData.source_id.length <= 0) {
    webix.html.addCss(sourceDbId.getNode(), "webix_invalid");
    return webix.message({ text: "Source DB required", type: "error" });
  } else {
    webix.html.removeCss(sourceDbId.$view, "webix_invalid");
  }

  if (inputData.target_id.length <= 0) {
    webix.html.addCss(targetDbId.getNode(), "webix_invalid");
    return webix.message({ text: "Target DB required", type: "error" });
  } else {
    webix.html.removeCss(targetDbId.$view, "webix_invalid");
  }

  if (inputData.table_name.length <= 0) {
    webix.html.addCss(schemaTblId.getNode(), "webix_invalid");
    return webix.message({ text: "Table name required", type: "error" });
  } else {
    webix.html.removeCss(schemaTblId.$view, "webix_invalid");
  }

  webix
    .ajax()
    .post(`${url}/runcopy`, inputData)
    .then(function (data) {
      console.log("data", data.json());

      webix.message({
        text: "Data copied",
        type: "success",
      });
    });
}

function execSpreadsheetType() {
  const data = $$(prefix + "_source_spredsheet").serialize();

  // Filter only first row has valid key name
  const obj = data[0];
  let filteredKey = [];
  Object.keys(obj).forEach((key) => {
    if (obj[key].length > 0) {
      filteredKey.push(key);
    }
  });

  // Filter data by key filtered
  const bodyData = data
    .map((jsonData) =>
      Object.fromEntries(
        Object.entries(jsonData).filter(([key, value]) =>
          filteredKey.includes(key)
        )
      )
    )
    .filter((e) => Object.values(e).join(""));
  if (bodyData.length > 0) {
    console.log("newData: ", bodyData);
  } else {
    webix.message({ text: "Nothing to copy !", type: "error" });
  }

  const targetDbId = $$(prefix + "_target_db");
  const sourceDbId = $$(prefix + "_source_db");
  const schemaTblId = $$(prefix + "_schema_table");
  const firstRowId = $$(prefix + "_first_row_column");
  const typeCopy = $$(prefix + "_source_type").getValue();

  const inputData = {
    type_copy: typeCopy,
    source_id: sourceDbId.getValue(),
    target_id: targetDbId.getValue(),
    table_name: schemaTblId.getValue(),
    data: JSON.stringify(bodyData),
    first_row: firstRowId.getValue(),
  };

  if (inputData.source_id.length <= 0) {
    webix.html.addCss(sourceDbId.getNode(), "webix_invalid");
    return webix.message({ text: "Source DB required", type: "error" });
  } else {
    webix.html.removeCss(sourceDbId.$view, "webix_invalid");
  }

  if (inputData.target_id.length <= 0) {
    webix.html.addCss(targetDbId.getNode(), "webix_invalid");
    return webix.message({ text: "Target DB required", type: "error" });
  } else {
    webix.html.removeCss(targetDbId.$view, "webix_invalid");
  }

  if (inputData.table_name.length <= 0) {
    webix.html.addCss(schemaTblId.getNode(), "webix_invalid");
    return webix.message({ text: "Table name required", type: "error" });
  } else {
    webix.html.removeCss(schemaTblId.$view, "webix_invalid");
  }

  webix
    .ajax()
    .post(`${url}/runcopy`, inputData)
    .then(function (data) {
      console.log("data", data.json());

      webix.message({
        text: "Data copied",
        type: "success",
      });
    });
}

function applyCopy() {
  webix.confirm({
    ok: "Yes",
    cancel: "No",
    text: "Are you sure to execute this action ?",
    callback: function (result) {
      if (result) {
        const st = $$(prefix + "_source_type").getValue();
        if (st == "query") {
          execQueryType();
        } else {
          execSpreadsheetType();
        }
      }
    },
  });
}

function runQuery(
  panelId,
  scrollBodyId,
  inputSourceId,
  sqlInputId,
  dynamicTableId,
  checkLimit
) {
  const inputSourceVal = inputSourceId.getValue();
  const sqlInputVal = sqlInputId.getValue();

  if (inputSourceVal.trim().length == 0 || sqlInputVal.trim().length == 0) {
    return webix.message({
      text: `${inputSourceId.config.placeholder} or SQL query required`,
      type: "error",
    });
  }

  if (checkLimit && !sqlInputVal.toLowerCase().includes("limit")) {
    return webix.message({
      text: "For performance reason, you must LIMIT your query,<br>eg: SELECT * FROM user LIMIT 1",
      type: "error",
    });
  }

  let input = {
    source_id: inputSourceVal,
    sql: sqlInputVal,
    dtype: 0,
    history: 1,
    adjustcol: 0,
    filter: 0,
  };

  webix.extend(panelId, webix.ProgressBar);
  panelId.showProgress({
    type: "icon",
    icon: "mdi mdi-loading z_mdi_loader",
  });
  panelId.disable();

  webix
    .ajax()
    .post(urlQuery + "/run", input)
    .then((r) => {
      let rData = r.json();

      if (typeof rData.error != "undefined") {
        webix.message({ text: rData.error, type: "error" });
        panelId.hideProgress();
        panelId.enable();
        return;
      }
      const newView = {
        view: "datatable",
        id: dynamicTableId,
        select: "row",
        css: "z_query_result_grid",
        columns: rData.config,
        resizeColumn: true,
        data: rData.data,
        resizeRow: true,
      };

      let views = scrollBodyId.getChildViews();
      if (views[0]) {
        scrollBodyId.removeView(views[0]);
      }
      scrollBodyId.addView(newView);
      panelId.hideProgress();
      panelId.enable();
    })
    .fail((e) => {
      webix.message({ text: e, type: "error" });
    });
}

export default class CopyDataPage extends JetView {
  config() {
    const toolbar = {
      view: "toolbar",
      css: "z_query_toolbar",
      elements: [
        {
          view: "combo",
          label: "From",
          placeholder: "choose",
          id: prefix + "_source_type",
          width: 160,
          labelWidth: 40,
          value: "query",
          options: [
            { id: "query", value: "Query" },
            { id: "spreadsheet", value: "Spreadsheet" },
          ],
          on: {
            onChange: function (id, val) {
              if (id == "query") {
                $$(prefix + "_source_db").show();
                $$(prefix + "_type_source_query").show();
                $$(prefix + "_type_source_sheet").hide();
                $$(prefix + "_first_row_column").hide();
                $$(prefix + "_row_count").hide();
              } else {
                $$(prefix + "_source_db").hide();
                $$(prefix + "_type_source_query").hide();
                $$(prefix + "_type_source_sheet").show();
                $$(prefix + "_first_row_column").show();
                $$(prefix + "_row_count").show();
                generateEmptyRow();
              }
            },
          },
        },
        {
          view: "combo",
          id: prefix + "_source_db",
          placeholder: "Source DB",
          width: 200,
          options: {
            url: `${urlProfile}/content?type=2&ls=true`,
            on: {
              onBeforeShow: function () {},
            },
          },
          on: {
            onChange: function (id, val) {},
          },
        },
        {
          view: "button",
          type: "icon",
          css: "zmdi_padding",
          icon: "mdi mdi-play",
          id: prefix + "_run_source_btn",
          tooltip: "Run source query",
          autowidth: true,
          click: function () {
            runQuery(
              $$(prefix + "_source_panel"),
              $$(prefix + "_scrollview_source"),
              $$(prefix + "_source_db"),
              $$(prefix + "_source_editor"),
              prefix + "_source_query_result",
              false
            );
          },
        },
        {
          view: "combo",
          label: "Row count",
          id: prefix + "_row_count",
          hidden: true,
          value: "100",
          width: 150,
          labelWidth: 70,
          options: ["100", "500", "1000"],
          on: {
            onChange: function (newv) {
              generateEmptyRow();
            },
          },
        },
        {
          view: "checkbox",
          labelRight: "First row as Column",
          id: prefix + "_first_row_column",
          hidden: true,
          tooltip: "First row as Header",
          labelWidth: 8,
          width: 150,
          value: 0,
        },
      ],
    };

    return {
      id: "z_copydata_page",
      rows: [
        toolbar,
        {
          id: prefix + "_source_panel",
          cols: [
            {
              id: prefix + "_type_source_query",
              cols: [
                {
                  view: "monaco-editor",
                  id: prefix + "_source_editor",
                  language: "sql",
                  minimap: {
                    enabled: false,
                  },
                },
                {
                  view: "resizer",
                },
                {
                  id: prefix + "_scrollview_source",
                  rows: [],
                },
              ],
            },
            {
              view: "scrollview",
              id: prefix + "_type_source_sheet",
              hidden: true,
              css: "copydata_scrollview",
              scroll: false,
              body: {
                id: prefix + "_scrollview_body",
                rows: [],
              },
            },
          ],
        },
        {
          view: "resizer",
        },
        {
          id: prefix + "_target_panel",
          rows: [
            {
              view: "toolbar",
              elements: [
                {
                  view: "label",
                  label: "To",
                  width: 30,
                  css: "z_label_size_9pt",
                },
                {
                  view: "combo",
                  id: prefix + "_target_db",
                  width: 200,
                  placeholder: "Target DB",
                  options: {
                    url: `${urlProfile}/content?type=2&ls=true`,
                    on: {
                      onBeforeShow: function () {},
                    },
                  },
                  on: {
                    onChange: function (id, val) {},
                  },
                },
                {
                  view: "text",
                  width: 150,
                  placeholder: "schema.table",
                  id: prefix + "_schema_table",
                },
                {
                  view: "button",
                  type: "icon",
                  css: "zmdi_padding",
                  icon: "mdi mdi-play",
                  id: prefix + "_run_target_btn",
                  tooltip: "Run target query",
                  autowidth: true,
                  click: function () {
                    runQuery(
                      $$(prefix + "_target_panel"),
                      $$(prefix + "_scrollview_target"),
                      $$(prefix + "_target_db"),
                      $$(prefix + "_target_editor"),
                      prefix + "_target_query_result",
                      true
                    );
                  },
                },
                { width: 20 },
                {
                  view: "button",
                  type: "icon",
                  icon: "mdi mdi-check-bold",
                  autowidth: true,
                  label: "Apply Copy",
                  click: function () {
                    applyCopy();
                  },
                },
              ],
            },
            {
              cols: [
                {
                  view: "monaco-editor",
                  id: prefix + "_target_editor",
                  language: "sql",
                  minimap: {
                    enabled: false,
                  },
                },
                {
                  view: "resizer",
                },
                {
                  id: prefix + "_scrollview_target",
                  rows: [],
                },
              ],
            },
          ],
        },
      ],
    };
  }
  ready() {}
}
