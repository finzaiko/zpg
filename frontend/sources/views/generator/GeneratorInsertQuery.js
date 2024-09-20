import { JetView } from "webix-jet";
import { state, url } from "../../models/Generator";
import { defaultHeader } from "../../helpers/api";
import { url as urlProfile } from "../../models/Profile";
import { LAST_DB_CONN_VIEWDATA } from "../../config/setting";
import { setEditorFontSize, showErrorResponse, showLoadingText } from "../../helpers/ui";
import { copyToClipboard } from "../../helpers/copy";

const prefixThis = state.prefix + "_insertquery";

function generate() {
  const editorId = $$(prefixThis + "_insertquery_ed");
  const data = {
    id: $$(prefixThis + "_source_combo").getValue(),
    querysql: editorId.getValue(),
    table: $$(prefixThis + "_table_name_txt").getValue(),
  };
  const panelId = $$(prefixThis + "_z_generator_content");
  showLoadingText(panelId, "Generate...");
  webix
    .ajax()
    .post(`${url}/insertquery`, data, function (res) {
      let rData = JSON.parse(res);
      if (typeof rData.data != "undefined") {
        $$(prefixThis + "_result").setValue(rData.data);
        panelId.hideOverlay();
      }
    })
    .fail(function (err) {
      console.log('err',err);

      panelId.hideOverlay();
      // showError(err);
      showErrorResponse(err.response);
      $$(prefixThis + "_result").setValue();
    });
}

const clearAll = () => {
  const editorId = $$(prefixThis + "_insertquery_ed");
  editorId.setValue("");
  editorId.getEditor(true).then((editor) => {
    editor.focus();
  });
  $$(prefixThis + "_result").setValue();
};

export default class GeneratorInsertQueryContent extends JetView {
  config() {
    const topToolbar = {
      view: "toolbar",
      elements: [
        {
          cols: [
            {
              view: "combo",
              id: prefixThis + "_source_combo",
              placeholder: "Source DB",
              width: 200,
              options: {
                url: `${urlProfile}/content?type=2&ls=true`,
              },
              on: {
                onChange: function (id, val) {
                  webix.storage.local.put(LAST_DB_CONN_VIEWDATA, id);
                },
              },
            },
            {
              view: "text",
              placeholder: "<schema.table>",
              id: prefixThis + "_table_name_txt",
              tooltip: "Table name to generate, eg: public.user",
            },
            {
              view: "button",
              type: "icon",
              css: "zmdi_padding",
              // icon: "mdi mdi-motion-play-outline",
              icon: "mdi mdi-play",
              tooltip: "Generate",
              autowidth: true,
              click: function () {
                generate();
              },
            },
            { width: 10 },
            {
              cols: [
                {
                  view: "button",
                  type: "icon",
                  icon: "mdi mdi-content-copy",
                  css: "zmdi_padding z_icon_color_primary z_icon_size_17",
                  autowidth: true,
                  id: prefixThis + "_copy_clipboard",
                  tooltip: "Copy result to clipboard",
                  click: function () {
                    this.hide();
                    const ck = $$(prefixThis + "_copy_clipboard_done");
                    ck.show();
                    setTimeout(() => {
                      this.show();
                      ck.hide();
                    }, 1500);

                    copyToClipboard($$(prefixThis + "_result").getValue());
                    // }
                  },
                },
                {
                  view: "button",
                  width: 55,
                  hidden: true,
                  id: prefixThis + "_copy_clipboard_done",
                  label: `<span class="mdi mdi-check-bold blink_me" style="font-size:16px;"></span>`,
                },
              ],
            },
            {
              view: "button",
              type: "icon",
              css: "zmdi_padding",
              icon: "mdi mdi-close",
              tooltip: "Reset",
              autowidth: true,
              click: function () {
                clearAll();
              },
            },
            {},
          ],
        },
      ],
    };

    return {
      id: `${prefixThis}_z_generator_content`,
      rows: [
        topToolbar,
        {
          view: "monaco-editor",
          id: prefixThis + "_insertquery_ed",
          language: "sql",
        },
        { view: "resizer" },
        {
          type:"line",
          rows: [
            {
              view: "monaco-editor",
              css: "z_console_editor",
              id: prefixThis + "_result",
              language: "sql",
              lineNumbers: "off",
              fontSize: "12px",
              borderless: true,
              renderLineHighlight: "none",
              readOnly: true,
            },
          ]
        },
      ],
    };
  }
  init() {
    const db = webix.storage.local.get(LAST_DB_CONN_VIEWDATA);
    if (db) {
      $$(prefixThis + "_source_combo").setValue(db);
    }
    setEditorFontSize($$(prefixThis + "_insertquery_ed"));
  }
}
