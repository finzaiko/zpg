import { JetView } from "webix-jet";
import { alphabetArr } from "../../helpers/alphabet";
import { url, state } from "../../models/CopyData";
import { url as urlProfile } from "../../models/Profile";

const prefix = state + "_page";

function generateEmptyRow() {
  let columnsName = [],
    dataEmpty = [];

  const panelId = $$(prefix + "_source_scrollview");
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
  webix.message({ text: "Not implemented yet", type: "error" });
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
  const inputData = data
    .map((jsonData) =>
      Object.fromEntries(
        Object.entries(jsonData).filter(([key, value]) =>
          filteredKey.includes(key)
        )
      )
    )
    .filter((e) => Object.values(e).join(""));
  if (inputData.length > 0) {
    console.log("newData: ", inputData);
  } else {
    webix.message({ text: "Nothing to copy !", type: "error" });
  }

  webix
  .ajax()
  .post(`${url}/save_result`, inputData)
  .then(function (data) {
    webix.message({
      text: "Data saved",
      type: "success",
    });
  });
}

function applyCopy() {
  const st = $$(prefix + "_source_type").getValue();
  if (st == "query") {
    execQueryType();
  } else {
    execSpreadsheetType();
  }
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
                $$("copysourcecombo").show();
                $$(prefix + "_source_editor").show();
                $$(prefix + "_source_scrollview").hide();
                $$(prefix + "_schema_table").hide();
                $$(prefix + "_first_row_header").hide();
                $$(prefix + "_row_count").hide();
              } else {
                $$("copysourcecombo").hide();
                $$(prefix + "_source_editor").hide();
                $$(prefix + "_source_scrollview").show();
                $$(prefix + "_schema_table").show();
                $$(prefix + "_first_row_header").show();
                $$(prefix + "_row_count").show();
                generateEmptyRow();
              }
            },
          },
        },
        {
          view: "combo",
          id: "copysourcecombo",
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
          view: "combo",
          id: "copytargetcombo",
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
          hidden: true,
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
          labelRight: "First row as Header",
          id: prefix + "_first_row_header",
          hidden: true,
          tooltip: "First row as Header",
          labelWidth: 8,
          width: 150,
          value: 0,
        },
        {
          view: "button",
          autowidth: true,
          value: "Apply copy",
          click: function () {
            applyCopy();
          },
        },
      ],
    };

    return {
      id: "z_copydata_page",
      rows: [
        toolbar,
        {
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
              view: "scrollview",
              id: prefix + "_source_scrollview",
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
          template: "Target: Result datatable",
        },
      ],
    };
  }
  ready() {}
}
