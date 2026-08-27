import { JetView } from "webix-jet";

export default class TextDiffView extends JetView {
  config() {
    return {
      rows: [
        {
          id: "z_init_jsonformatter",
          template: `<div style="display:flex;align-items:center;justify-content:center;height:100%;color: #ff9752">Preparing editor...</div>`,
        },
        {
          id: "z_main_jsonformatter",
          hidden: true,
          cols: [
            {
              view: "json-editor",
              id: "je1",
              placeholder: "Paste or type JSON here",
            },
            {
              padding: 8,
              rows: [
                {
                  height: 36,
                  css: "toolbar_empty",
                },
                {},
                {
                  view: "button",
                  label: "Format",
                  tooltip: "Beutify",
                  align: "center",
                  width: 85,
                  css: "btn_accent",
                  click: function () {
                    $$("je2").setValue($$("je1").getValue());
                    $$("je2").format();
                    const originalText = $$("je1").getValue();
                    webix.storage.local.put("JSONFMT_ORIG", originalText);
                  },
                },
                {
                  view: "button",
                  align: "center",
                  label: "Compact",
                  width: 85,
                  css: "btn_accent",
                  tooltip: "Minify",
                  click: function () {
                    $$("je2").setValue($$("je1").getValue());
                    $$("je2").compact();
                  },
                },
                {},
              ],
            },
            {
              view: "json-editor",
              id: "je2",
              placeholder: "Result will be shown here",
            },
          ],
        },
      ],
    };
  }
  ready() {
    document.title = "ZPG - JSON Formatter";
    setTimeout(() => {
      $$("z_init_jsonformatter").hide();
      $$("z_main_jsonformatter").show();
      const lastOriginalText = webix.storage.local.get("JSONFMT_ORIG");
      console.log("lastOriginalText", lastOriginalText);
      if (lastOriginalText) {
        $$("je1").setValue(lastOriginalText);
      }
    }, 1000);
  }
}
