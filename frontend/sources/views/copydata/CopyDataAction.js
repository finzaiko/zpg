import { showLoadingText } from "../../helpers/ui";
import {
  checkTableExist,
  runCopyData,
  runCreateTable,
} from "../../models/CopyData";
import { state } from "../../models/CopyData";
import { confirmTableField } from "./CopyDataConfirmTable";

const prefix = state + "_page";

export function confirmCreateTableAndCopyData(inputData) {
  webix.confirm({
    ok: "Yes",
    cancel: "No",
    text: "Are you sure to execute this action ?",
    callback: function (result) {
      if (result) {
        showLoadingText($$("z_copydata_page"), "Creating new table...");
        runCreateTable(inputData).then((isCreate) => {
          $$(prefix + "confirm_table").close();
          showLoadingText(
            $$("z_copydata_page"),
            "Copying data, please wait..."
          );
          runCopyData(inputData)
            .then((r) => {
              setTimeout(() => {
                const msg = JSONToListText(r);
                setConsoleMessage(msg);
                webix.message({
                  text: r.message,
                  type: r.error ? "error" : "success",
                });
                $$("z_copydata_page").hideOverlay();
              }, 1000);
            })
            .fail((e) => {
              const rError = JSON.parse(e.response);
              setConsoleMessage(rError.message);
              $$("z_copydata_page").hideOverlay();
            });
        });
      }
    },
  });
}

function setConsoleMessage(msg) {
  if (msg.length > 0) {
    $$(prefix + "console_panel").show();
    $$(prefix + "console_resizer").show();
    $$(prefix + "console_panel").config.height = 120;
    $$(prefix + "console_panel").resize();
    $$(prefix + "console_result").setHTML(`
        <div style='font-family: monospace;padding-top:10px;'>${msg}</div>`);
  }
}

function validateForm(inputData) {
  const targetDbId = $$(prefix + "_target_db");
  const sourceDbId = $$(prefix + "_source_db");
  const schemaTblId = $$(prefix + "_schema_table");

  if (inputData.target_id.length == 0) {
    webix.html.addCss(targetDbId.getNode(), "webix_invalid");
    webix.message({ text: "Target DB required", type: "error" });
  } else {
    webix.html.removeCss(targetDbId.$view, "webix_invalid");
  }

  if (inputData.table_name.length == 0) {
    webix.html.addCss(schemaTblId.getNode(), "webix_invalid");
    webix.message({ text: "Table name required", type: "error" });
  } else {
    webix.html.removeCss(schemaTblId.$view, "webix_invalid");
  }

  const type = $$(prefix + "_source_type").getValue();
  if (type == "query") {
    if (inputData.source_id.length == 0) {
      webix.html.addCss(sourceDbId.getNode(), "webix_invalid");
      webix.message({ text: "Source DB required", type: "error" });
    } else {
      webix.html.removeCss(sourceDbId.$view, "webix_invalid");
    }

    if (inputData.source_query.length == 0) {
      webix.message({ text: "Query sql empty", type: "error" });
    }
    if (
      inputData.source_id.length == 0 ||
      inputData.target_id.length == 0 ||
      inputData.table_name.length == 0 ||
      inputData.source_query.length == 0
    ) {
      return false;
    }
  } else {
    if (inputData.target_id.length == 0 || inputData.table_name.length == 0) {
      return false;
    }
  }

  return true;
}

export function getInputData() {
  return {
    type_copy: $$(prefix + "_source_type").getValue(),
    source_id: $$(prefix + "_source_db").getValue(),
    target_id: $$(prefix + "_target_db").getValue(),
    source_query: $$(prefix + "_source_editor").getValue(),
    table_name: $$(prefix + "_schema_table").getValue(),
    first_row: $$(prefix + "_first_row_column").getValue(),
    source_data: [],
    table_field: {},
  };
}

function confirmCopyData(inputData) {
  webix.confirm({
    ok: "Yes",
    cancel: "No",
    text: "Are you sure to execute this action ?",
    callback: function (result) {
      if (result) {
        runCopyData(inputData)
          .then((r) => {
            setTimeout(() => {
              const msg = JSONToListText(r);
              setConsoleMessage(msg);
              webix.message({
                text: r.message,
                type: r.error ? "error" : "success",
              });
              $$("z_copydata_page").hideOverlay();
            }, 1000);
          })
          .fail((e) => {
            const rError = JSON.parse(e.response);
            setConsoleMessage(rError.message);
            $$("z_copydata_page").hideOverlay();
          });
      }
    },
  });
}

export function applyCopyAction() {
  const inputData = getInputData();

  const isValid = validateForm(inputData);
  if (isValid) {
    showLoadingText($$("z_copydata_page"), "Check existing table...");
    checkTableExist(inputData)
      .then((table) => {
        setTimeout(() => {
          $$("z_copydata_page").hideOverlay();
          if (inputData.type_copy == "query") {
            if (!table.exists) {
              confirmTableField(inputData, table.source_fields);
            } else {
              confirmCopyData(inputData);
            }
          } else {
            // TODO:
            const sheetData = getSpreadsheetField();
            console.log("sheetData>>>>>>>", sheetData);

            if (!table.exists) {
              confirmTableField(
                inputData,
                sheetData.table_field,
                sheetData.source_data
              );
            } else {
              inputData.table_field = JSON.stringify(sheetData.table_field);
              inputData.source_data = JSON.stringify(sheetData.source_data);
              inputData.table_exist = true;
              confirmCopyData(inputData);
            }
          }
        }, 1000);
      })
      .fail((e) => {
        const rError = JSON.parse(e.response);
        setConsoleMessage(rError.message);
        $$("z_copydata_page").hideOverlay();
      });
  }
}

function getSpreadsheetField() {
  const data = $$(prefix + "_source_spredsheet").serialize();
  const isFirstRow = $$(prefix + "_first_row_column").getValue();

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
    let newField = [];
    Object.entries(bodyData[0]).forEach((entry) => {
      const [key, value] = entry;
      if (isFirstRow) {
        newField.push({
          label: value,
          type: "combo",
          id: value,
          value: "text",
        });
      } else {
        newField.push({ label: key, type: "combo", id: key, value: "text" });
      }
    });

    if (isFirstRow) {
      bodyData.shift();
    }
    console.log("newField", newField);

    return { source_data: bodyData, table_field: newField };
  } else {
    webix.message({ text: "Nothing to copy !", type: "error" });
  }
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
}
