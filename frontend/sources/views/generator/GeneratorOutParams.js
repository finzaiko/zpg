import { JetView } from "webix-jet";
import { state, url } from "../../models/Generator";
import { defaultHeader } from "../../helpers/api";
import { url as urlProfile } from "../../models/Profile";
import { LAST_DB_CONN_VIEWDATA } from "../../config/setting";
import { setEditorFontSize, showErrorResponse } from "../../helpers/ui";

const prefixThis = state.prefix + "_outprms";

function generate() {
  const editorId = $$(prefixThis + "_outparams_ed");
  const data = {
    id: $$(prefixThis + "_source_combo").getValue(),
    querysql: editorId.getValue(),
  };

  webix
    .ajax()
    .headers(defaultHeader())
    .post(`${url}/outparams`, data, function (res) {
      let rData = JSON.parse(res);
      if (typeof rData.data != "undefined") {
        $$(prefixThis + "_result").setHTML(
          "<pre id='generator_result'>" + rData.data + "</pre>"
        );
      }
    })
    .fail(function (err) {
      showErrorResponse(err.response);
    });
}

const copyToClipboard = (viewId, text) => {
  try {
    navigator.clipboard.writeText(text);
    webix.extend(viewId, webix.OverlayBox);
    viewId.showOverlay(
      `<div class="z_overlay"><span class='z_copied_label animate__animated animate__flash'>Copied! <span class='mdi mdi-checkbox-marked-circle-outline' style='color:orange;'></span></span></div>`
    );
    setTimeout(() => {
      viewId.hideOverlay();
    }, 1000);
  } catch (err) {
    console.error("Failed to copy: ", err);
  }
};

const clearAll = () => {
  const editorId = $$(prefixThis + "_outparams_ed");
  editorId.setValue("");
  editorId.getEditor(true).then((editor) => {
    editor.focus();
  });
  const val = document.getElementById("generator_result");
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
              view: "icon",
              // icon: "mdi mdi-motion-play-outline",
              icon: "mdi mdi-play-box-outline",
              tooltip: "Generate",
              autowidth: true,
              click: function () {
                generate();
              },
            },
            { width: 10 },
            {
              view: "icon",
              icon: "mdi mdi-content-copy",
              tooltip: "Copy result content",
              css: "z_mdi_icon_smaller",
              autowidth: true,
              click: function () {
                const val = document.getElementById("generator_result");
                if (val) {
                  copyToClipboard($$(prefixThis + "_result"), val.innerHTML);
                }
              },
            },
            {
              view: "icon",
              icon: "mdi mdi-refresh",
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
      id: "z_generator_content",
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
