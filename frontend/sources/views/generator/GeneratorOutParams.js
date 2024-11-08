import { JetView } from "webix-jet";
import { state, url } from "../../models/Generator";
import { defaultHeader } from "../../helpers/api";
import { url as urlProfile } from "../../models/Profile";
import { LAST_DB_CONN_VIEWDATA } from "../../config/setting";
import { setEditorFontSize, showErrorResponse, showLoadingText } from "../../helpers/ui";
import { copyToClipboard } from "../../helpers/copy";

const prefixThis = state.prefix + "_outprms";

function generate() {
  const editorId = $$(prefixThis + "_outparams_ed");
  const sql = editorId.getValue();
  const sourceDb = $$(prefixThis + "_source_combo").getValue();
  if (sql.length == 0 || sourceDb.length == 0) {
    return webix.message({
      text: "Please select source DB and type your Query",
      type: "error",
    });
  }
  const data = {
    id: sourceDb,
    querysql: sql.replace(/'/g, "''"),
    type: $$(prefixThis + "_type_combo").getValue(),
    dtype: $$(prefixThis + "_defined_type_chk").getValue()
  };

  const panelId = $$(prefixThis+"_z_generator_content");
  showLoadingText(panelId, "Generate...");
  webix
    .ajax()
    .post(`${url}/outparams`, data, function (res) {
      let rData = JSON.parse(res);
      if (typeof rData.data != "undefined") {
        $$(prefixThis + "_result").setHTML(
          `<pre id='${prefixThis}_generator_result'>${rData.data}</pre>`
        );
      }
      panelId.hideOverlay();
    })
    .fail(function (err) {
      panelId.hideOverlay();
      showErrorResponse(err.response);
    });
}

const clearAll = () => {
  const editorId = $$(prefixThis + "_outparams_ed");
  editorId.setValue("");
  editorId.getEditor(true).then((editor) => {
    editor.focus();
  });
  const val = document.getElementById(`${prefixThis}_generator_result`);
  if (val) {
    val.innerHTML = "";
  }
};

export default class GeneratorOutParamsContent extends JetView {
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
              view: "combo",
              id: prefixThis + "_type_combo",
              placeholder: "Type",
              value: 1,
              width: 160,
              options: [
                {id: 1, value: "Default"},
                {id: 2, value: "Field name and type"},
                {id: 3, value: "Field name only"},
              ],
              on: {
                onChange: function (id, val) {
                  if(id==1 || id==2){
                    $$(prefixThis + "_defined_type_chk").show();
                  }else{
                    $$(prefixThis + "_defined_type_chk").hide();
                  }
                },
              },
            },
            {
              view:"checkbox",
              labelRight:"Defined Type",
              id: prefixThis + "_defined_type_chk",
              value: 0,
              labelWidth: 6,
              width: 130,
            },
            {
              view: "button",
              type: "icon",
              css: "zmdi_padding",
              icon: "mdi mdi-play",
              tooltip: "Generate",
              id: prefixThis + "_refresh_btn",
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

                    const val = document.getElementById(`${prefixThis}_generator_result`);
                    if (val) {
                      copyToClipboard(val.innerHTML);
                    }
                  },
                },
                {
                  view: "button",
                  width: 55,
                  hidden: true,
                  id: prefixThis + "_copy_clipboard_done",
                  label:
                  `<span class="mdi mdi-check-bold blink_me" style="font-size:16px;"></span>`
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
      id: prefixThis+"_z_generator_content",
      rows: [
        topToolbar,
        {
          view: "monaco-editor",
          id: prefixThis + "_outparams_ed",
          language: "sql",
        },
        { view: "resizer" },
        {
          view: "template",
          scroll: "xy",
          css: "z_out_template",
          id: prefixThis + "_result",
          // template: "Result",
        },
      ],
    };
  }
  init() {
    const db = webix.storage.local.get(LAST_DB_CONN_VIEWDATA);
    if (db) {
      $$(prefixThis + "_source_combo").setValue(db);
    }
    setEditorFontSize($$(prefixThis + "_outparams_ed"));
  }
}
