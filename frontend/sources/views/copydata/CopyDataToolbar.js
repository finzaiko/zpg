import { state } from "../../models/CopyData";
import { url as urlProfile } from "../../models/Profile";
import { applyCopyAction, sourceTypeChanges } from "./CopyDataAction";
import { csvToArray } from "../../helpers/ui";
const prefix = state + "_page";

export default toolbar = {
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
        { id: "query", value: "query" },
        { id: "spreadsheet", value: "spreadsheet" },
        { id: "csv", value: "csv" },
      ],
      on: {
        onChange: function (id, val) {
          sourceTypeChanges(id);
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
        onChange: function (id, val) {
          validateApply();
        },
      },
    },
    {
      view: "combo",
      label: "Delimeter",
      id: prefix + "_uploadcsv_delimeter",
      hidden: true,
      width: 130,
      labelWidth: 70,
      options: [
        { id: 1, value: "," },
        { id: 2, value: ";" },
      ],
      on: {
        onChange: function (newv) {
          if (newv) {
            $$(prefix + "_uploadcsv_btn").enable();
          } else {
            $$(prefix + "_uploadcsv_btn").disable();
          }
        },
      },
    },
    {
      view: "uploader",
      value: "Choose file",
      id: prefix + "_uploadcsv_btn",
      accept: ".csv, text/csv",
      css: "webix_secondary",
      autosend: false,
      hidden: true,
      disabled: true,
      autowidth: true,
      multiple: false,
      on: {
        onBeforeFileAdd: function (upload) {
          if ($$(prefix + "_uploadcsv_delimeter").getValue().length == 0) {
            return webix.message({
              text: "Please select delimeter",
              type: "error",
            });
          }
          const file = upload.file;
          const reader = new FileReader();
          reader.onload = function (event) {
            const text = event.target.result;
            const delimeter = $$(prefix + "_uploadcsv_delimeter").getText();
            const { col_name, data } = csvToArray(text, delimeter);
            viewCSVFile(col_name, data);
          };
          reader.readAsText(file);
          return false;
        },
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
      options: ["100", "500", "1000", "3000", "6000"],
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
    // Target toolbar
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
        onChange: function (id, val) {
          validateApply();
        },
      },
    },
    {
      view: "text",
      width: 150,
      placeholder: "schema.table",
      id: prefix + "_schema_table",
      on: {
        onTimedKeypress: function () {
          validateApply();
        },
      },
    },
    {
      view: "button",
      value: "X",
      tooltip: "Cancel, clear source data",
      autowidth: true,
      hidden: true,
      css: "zmdi_padding",
      id: prefix + "_cancel_action",
      click: function () {
        const type = $$(prefix + "_source_type").getValue();
        if (type == "query") {
        } else if (type == "spreadsheet") {
          generateEmptyRow();
        } else {
          $$(prefix + "_uploadcsv_viewer").hide();
          $$(prefix + "_uploadcsv_empty").show();
          const vbodyId = $$(prefix + "_uploadcsv_scroll_body");
          const views = vbodyId.getChildViews();
          if (views[0]) {
            vbodyId.removeView(views[0]);
          }
        }
        this.hide();
      },
    },
    { width: 20 },
    {
      view: "button",
      type: "icon",
      id: prefix + "apply_copy",
      icon: "mdi mdi-check-bold",
      autowidth: true,
      disabled: true,
      label: "Apply Copy",
      click: function () {
        applyCopyAction();
      },
    },
  ],
};

function viewCSVFile(colName, data) {
  $$(prefix + "_uploadcsv_viewer").show();
  $$(prefix + "_cancel_action").show();
  let columnsName = [];
  colName.forEach((o, i) => {
    columnsName.push({ id: o, header: o, editor: "text" });
  });

  const newView = {
    view: "datatable",
    id: prefix + "_csv_data",
    select: "row",
    css: "webix_data_border webix_header_border copydata_spreadsheet",
    resizeColumn: true,
    resizeRow: true,
    editable: true,
    columns: columnsName,
    data: data,
    scheme: {
      $init: function (obj) {
        obj.index = this.count();
      },
    },
  };

  const vbodyId = $$(prefix + "_uploadcsv_scroll_body");
  const views = vbodyId.getChildViews();
  if (views[0]) {
    vbodyId.removeView(views[0]);
  }
  vbodyId.addView(newView);
  $$(prefix + "_uploadcsv_empty").hide();
}

function validateApply() {
  const targetDbId =
    $$(prefix + "_target_db")
      .getValue()
      .trim().length > 0;
  const sourceDbId =
    $$(prefix + "_source_db")
      .getValue()
      .trim().length > 0;
  const schemaTblId =
    $$(prefix + "_schema_table")
      .getValue()
      .trim().length > 0;

  const type = $$(prefix + "_source_type").getValue();
  if (type == "query") {
    if (targetDbId && sourceDbId && schemaTblId) {
      $$(prefix + "apply_copy").enable();
    } else {
      $$(prefix + "apply_copy").disable();
    }
  } else {
    if (targetDbId && schemaTblId) {
      $$(prefix + "apply_copy").enable();
    } else {
      $$(prefix + "apply_copy").disable();
    }
  }
}
