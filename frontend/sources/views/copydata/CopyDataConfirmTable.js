import { state } from "../../models/CopyData";
import { getInputData } from "./CopyDataAction";
import { confirmCreateTableAndCopyData } from "./CopyDataPage";
const prefix = state + "_page";

export function confirmTableField(inputData, fieldData, spreadsheetData) {
  const dataTypeOptions = ["text", "integer", "numeric", "boolean"];

  const dataEl = fieldData.map((v) => ({
    ...v,
    type: "combo",
    options: dataTypeOptions,
  }));

  webix
    .ui({
      view: "window",
      id: prefix + "confirm_table",
      width: 300,
      modal: true,
      move: true,
      position: "center",
      head: "Table not found",
      css: "boxline_shadow",
      body: {
        rows: [
          {
            autoheight: true,
            template: `<p style='text-align:center;'>Table <strong>${inputData.table_name}</strong> does not exist on target schema, do you want create new one ?</p>`,
          },
          {
            view: "scrollview",
            scroll: true,
            height: 300,
            body: {
              rows: [
                {
                  id: prefix + "field_props",
                  view: "property",
                  complexData: true,
                  elements: dataEl,
                  autoheight: true,
                },
              ],
            },
          },
          {
            view: "toolbar",
            elements: [
              {},
              {
                view: "button",
                label: "Yes",
                css: "webix_primary",
                autowidth: true,
                click: function () {
                  const val = $$(prefix + "field_props").getValues();
                  const inputData = getInputData();
                  inputData.table_field = JSON.stringify(val);
                  if (inputData.type_copy == "query") {
                    confirmCreateTableAndCopyData(inputData);
                  } else {
                    inputData.source_data = JSON.stringify(spreadsheetData);
                    confirmCreateTableAndCopyData(inputData);
                  }
                },
              },
              {
                view: "button",
                label: "No",
                autowidth: true,
                click: function () {
                  $$(prefix + "confirm_table").close();
                },
              },
            ],
          },
        ],
      },
    })
    .show();
}
