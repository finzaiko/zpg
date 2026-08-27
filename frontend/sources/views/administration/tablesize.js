import { JetView } from "webix-jet";
import { runView, state, url } from "../../models/Administration";
import {
  autoExpandColumnSize,
  showLoadingText,
  toTitleCase,
} from "../../helpers/ui";
import { runDBQuery } from "../../helpers/api";
const prefix = state.prefix;
const prefixThis = state.prefix + "_tblsize";

function formatSize(bytes) {
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 B";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

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

  if (action != "dbsize") {
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
        // setTimeout(() => {
        //   autoExpandColumnSize($$(tableViewId));
        // }, 300);
      } else {
        const newView = {
          template: `<div style="text-align:center;margin-top:50px;">No data</div>`,
        };
        mainView.show();
        bodyView.addView(newView);
      }
      const panelId = $$(prefix + "_mainview");
      webix.extend(panelId, webix.OverlayBox);
      panelId.hideOverlay();
      if (action != "dbsize") {
        mainView.hideOverlay();
      }
      return action;
    })
    .fail(function (err) {
      const panelId = $$(prefix + "_mainview");
      webix.extend(panelId, webix.OverlayBox);
      panelId.hideOverlay();
      if (action != "dbsize") {
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
      const viewMode = $$(prefixThis + "_seg_viewer").getValue();
      if (viewMode == "list") {
        showTableContent(
          "schemasize",
          itemDb.name,
          $$(prefixThis + "_schema_scrollview"),
          $$(prefixThis + "_scrollview_schema_body"),
          prefixThis + "_schema_viewer"
        ).then((_) => {
          loadTableView(itemDb);
        });
      } else {
        showScemaSizeGraph();
      }
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

function showScemaSizeGraph() {
  const itemDb = $$(prefixThis + "_db_viewer").getItem($$(prefixThis + "_db_viewer").getSelectedId());
  const dbName = itemDb.name;

  const serverSource = $$(prefix + "_server").getValue();
  if (!serverSource) {
    webix.message({ text: "Please choose source server", type: "error" });
    return;
  }

  const inputData = {
    source_id: serverSource,
    action: "schemasizegraph",
    db_name: dbName,
  };

  runDBQuery(url, "view", inputData).then((r) => {
    const schemaData = {
      name: "Database",
      children: r.data,
    };

    const newView = {
      view: "echart",
      option: {
        tooltip: {
          trigger: "item",
          formatter: function (params) {
            return `${params.name}<br/>Size: ${formatSize(
              params.value
            )}`;
          },
        },
        series: [
          {
            name: "Schemas",
            type: "treemap",
            visibleMin: 100,
            data: schemaData.children,
            roam: true, // Enable zooming
            nodeClick: "zoomToNode", // Zoom on click
            width: "100%",
            height: "100%",
            label: {
              show: true,
              formatter: function (params) {
                return params.name + "\n" + formatSize(params.value);
              },
            },
            breadcrumb: {
              show: true,
            },
            colorBy: "data",
            itemStyle: {
              borderColor: "#fff",
              borderWidth: 1,
              gapWidth: 1,
            },
          },
        ],
      },
    };

    // const newViewTest = { view: "echartFrame", height: 400 };

    let views = $$(prefixThis + "_scrollview_body").getChildViews();
    if (views[0]) {
      $$(prefixThis + "_scrollview_body").removeView(views[0]);
    }
    $$(prefixThis + "_scrollview_body").addView(newView);
  });
}

export default class TableSizePanel extends JetView {
  config() {
    return {
      rows: [
        {
          cols: [
            {
              rows: [
                {
                  view: "toolbar",
                  elements: [
                    {
                      view: "label",
                      label: "Database",
                      css: "header_label",
                    },
                    {},
                    {
                      view: "segmented",
                      id: prefixThis + "_seg_viewer",
                      value: "list",
                      options: [
                        { id: "list", value: "List" },
                        { id: "graph", value: "Graph" },
                      ],
                      on: {
                        onChange: function (newv, _) {
                          if (newv == "list") {
                            $$(prefixThis + "_graph_viewer").hide();
                            $$(prefixThis + "_list_viewer").show();
                          } else {
                            $$(prefixThis + "_graph_viewer").show();
                            $$(prefixThis + "_list_viewer").hide();
                            showScemaSizeGraph();
                          }
                        },
                      },
                    },
                  ],
                },
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
            {
              view: "resizer",
            },
            {
              gravity: 3,
              rows: [
                {
                  id: prefixThis + "_list_viewer",
                  cols: [
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
                // {
                //   id: prefixThis + "_graph_viewer",
                //   // template: "graph view",
                //   hidden: true,

                //   view: "iframe",
                //   src: "http://localhost:9000/tblsizeviewer",
                //   // header: "Size Graph",
                //   // body: {
                //   //   id: prefix + "_scrollview_body",
                //   //   rows: [{ template: "Graph view"}],
                //   // },
                // },
                {
                  view: "scrollview",
                  // id: prefix + "_result_scrollview",
                  id: prefixThis + "_graph_viewer",
                  hidden: true,
                  scroll: false,
                  body: {
                    id: prefixThis + "_scrollview_body",
                    rows: [],
                  },
                },
              ],
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
