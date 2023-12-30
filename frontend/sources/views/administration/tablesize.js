import { JetView } from "webix-jet";
import { runView, state } from "../../models/Administration";
import { autoExpandColumnSize, showLoadingText, toTitleCase } from "../../helpers/ui";
const prefix = state.prefix;
const prefixThis = state.prefix + "_tblsize";

function showTableContent(
  action,
  dbName,
  mainView,
  bodyView,
  tableViewId,
  schemaName
) {
  const serverSource = $$(prefix + "_server").getValue();
  if (!serverSource) {
    webix.message({ text: "Please choose source server", type: "error" });
    return;
  }

  const inputData = {
    source_id: serverSource,
    action: action,
    db_name: dbName,
    schema_name: schemaName,
  };

  if(action!="dbsize"){
    showLoadingText(mainView);
  }

  let views = bodyView.getChildViews();

  if (views[0]) {
    bodyView.removeView(views[0]);
  }

  return runView(inputData)
    .then((r) => {

      if (r.data.length > 0) {
        const cols = Object.keys(r.data[0]);

        let colConfig = [];

        cols.forEach((o) => {
          colConfig.push({
            id: o,
            header: [
              toTitleCase(o.replace(/_/g, " ")),
              { content: "textFilter" },
            ],
            width: 100,
            sort: o == "actual_size" || o == "row_count" ? "int" : "string",
            editor: "text",
          });
        });

        const newView = {
          view: "datatable",
          resizeColumn: true,
          id: tableViewId,
          data: r.data,
          select: "row",
          columns: colConfig,
          editable: true,
          editaction: "dblclick",
        };

        mainView.show();
        bodyView.addView(newView);
        setTimeout(() => {
          autoExpandColumnSize($$(tableViewId));
        }, 300);
      } else {
        const newView = {
          template: "No data",
        };
        mainView.show();
        bodyView.addView(newView);
      }
      const panelId = $$(prefix + "_mainview");
      webix.extend(panelId, webix.OverlayBox);
      panelId.hideOverlay();
      if(action!="dbsize"){
        mainView.hideOverlay();
      }
      return action;
    })
    .fail(function (err) {
      const panelId = $$(prefix + "_mainview");
      webix.extend(panelId, webix.OverlayBox);
      panelId.hideOverlay();
      if(action!="dbsize"){
        mainView.hideOverlay();
      }
    });
}

function loadTableView(itemDb) {
  showGuider(
    $$(prefixThis + "_tbl_scrollview"),
    $$(prefixThis + "_scrollview_tbl_body"),
    "Click Schema"
  );

  $$(prefixThis + "_schema_viewer").attachEvent(
    "onItemClick",
    function (idSchema) {
      const itemSchema = $$(prefixThis + "_schema_viewer").getItem(idSchema);
      showTableContent(
        "tblsize",
        itemDb.name,
        $$(prefixThis + "_tbl_scrollview"),
        $$(prefixThis + "_scrollview_tbl_body"),
        prefixThis + "_tbl_viewer",
        itemSchema.name
      );
    }
  );
}

function loadSchemaView(r) {
  if (r == "dbsize") {
    showGuider(
      $$(prefixThis + "_schema_scrollview"),
      $$(prefixThis + "_scrollview_schema_body"),
      "Click Database"
    );

    $$(prefixThis + "_db_viewer").attachEvent("onItemClick", function (idDb) {
      const itemDb = $$(prefixThis + "_db_viewer").getItem(idDb);
      showTableContent(
        "schemasize",
        itemDb.name,
        $$(prefixThis + "_schema_scrollview"),
        $$(prefixThis + "_scrollview_schema_body"),
        prefixThis + "_schema_viewer"
      ).then((_) => {
        loadTableView(itemDb);
      });
    });
  }
}

function showGuider(mainView, bodyView, text) {
  setTimeout(() => {
    let views = bodyView.getChildViews();

    if (views[0]) {
      bodyView.removeView(views[0]);
    }
    mainView.show();
    bodyView.addView({
      template: `<div class="shake-container">
      <div class="shake-element"><span class='mdi mdi-arrow-left shake-icon'>&nbsp;&nbsp;</span>${text}</div></div>`,
    });
  }, 600);
}

export default class TableSizePanel extends JetView {
  config() {
    return {
      rows: [
        {
          cols: [
            {
              header: "Database",
              body: {
                rows: [
                  {
                    view: "scrollview",
                    id: prefixThis + "_db_scrollview",
                    scroll: false,
                    body: {
                      id: prefixThis + "_scrollview_db_body",
                      rows: [],
                    },
                  },
                ],
              },
            },
            {
              view: "resizer",
            },
            {
              header: "Schema",
              body: {
                rows: [
                  {
                    view: "scrollview",
                    id: prefixThis + "_schema_scrollview",
                    scroll: false,
                    body: {
                      id: prefixThis + "_scrollview_schema_body",
                      rows: [],
                    },
                  },
                ],
              },
            },
            {
              view: "resizer",
            },
            {
              header: "Table",
              body: {
                rows: [
                  {
                    view: "scrollview",
                    id: prefixThis + "_tbl_scrollview",
                    scroll: false,
                    body: {
                      id: prefixThis + "_scrollview_tbl_body",
                      rows: [],
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    };
  }
  urlChange(view, url) {
    showTableContent(
      "dbsize",
      "",
      $$(prefixThis + "_db_scrollview"),
      $$(prefixThis + "_scrollview_db_body"),
      prefixThis + "_db_viewer"
    ).then((r) => {
      loadSchemaView(r);
    });
  }
}
