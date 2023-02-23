import { JetView } from "webix-jet";
import { state } from "../../models/CopyData";
import CopyDataConsole from "./CopyDataConsole";
import CopyDataToolbar from "./CopyDataToolbar";
const prefix = state + "_page";

export default class CopyDataPage extends JetView {
  config() {
    return {
      id: "z_copydata_page",
      rows: [
        CopyDataToolbar,
        {
          rows: [
            {
              id: prefix + "_source_panel",
              cols: [
                // Query panel ----------------
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
                      id: prefix + "_scrollview_source",
                      rows: [],
                    },
                  ],
                },
                // Spreadsheet panel ----------------
                {
                  view: "scrollview",
                  id: prefix + "_type_source_sheet",
                  hidden: true,
                  css: "copydata_scrollview",
                  // scroll: true,
                  body: {
                    id: prefix + "_scrollview_body",
                    rows: [],
                  },
                },
                // Uplaod CSV panel ----------------
                {
                  hidden: true,
                  id: prefix + "_type_uploadcsv",
                  rows: [
                    {
                      view: "scrollview",
                      id: prefix + "_uploadcsv_viewer",
                      hidden: true,
                      scroll: false,
                      body: {
                        id: prefix + "_uploadcsv_scroll_body",
                        rows: [],
                      },
                    },
                    {
                      id: prefix + "_uploadcsv_empty",
                      template: `<div class='z_center_middle font_size14'>Please choose file, first row as field name</div>`,
                    },
                  ],
                },
              ],
            },
            {
              view: "resizer",
              css: "z_resizer",
              id: prefix + "console_resizer",
              hidden: true,
            },
            CopyDataConsole,
          ],
        },
      ],
    };
  }
  ready() {}
}
