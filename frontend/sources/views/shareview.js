import { JetView } from "webix-jet";
import { copyToClipboard } from "../helpers/copy";
import { showProgressLoading } from "../helpers/ui";
import { state, url } from "../models/Share";

const prefix = state.prefix + "_view";

export default class ShareView extends JetView {
  config() {
    const navbar = {
      view: "toolbar",
      css: "z_navbar_viewshare",
      cols: [
        { width: 10 },
        {
          view: "label",
          css: "z_navbar_brand",
          label: "ZPG share",
          width: 80,
        },
        {
          view: "icon",
          icon: "mdi mdi-content-copy",
          width: 30,
          id: prefix + "_copy_shareview",
          tooltip: "Copy to clipboard",
          css: "z_icon_color_primary z_icon_size_16 z_icon_white",
          click: function () {
            this.hide();
            const ck = $$(prefix + "_copy_shareview_done");
            ck.show();
            setTimeout(() => {
              this.show();
              ck.hide();
            }, 1500);

            copyToClipboard("content");
          },
        },
        {
          view: "template",
          css: "copied_done",
          width: 30,
          hidden: true,
          borderless: true,
          id: prefix + "_copy_shareview_done",
          template:
            '<svg class="animated-check-white" viewBox="0 0 24 24"><path d="M4.1 12.7L9 17.6 20.3 6.3" fill="none"/></svg>',
        },
        {},
        {
          view: "label",
          label: "from: user123",
          width: 200,
          align: "right",
          css: "z_label_normal",
        },
        {
          view: "label",
          label: "at: 01-01-2023 10:10:10",
          width: 140,
          css: "z_label_normal",
        },
      ],
    };

    return {
      rows: [
        navbar,
        {
          view: "monaco-editor",
          id: prefix + "_shareview_ed",
          language: "sql",
        },
      ],
    };
  }
  init(view) {}
  ready() {
    const edId = $$(prefix + "_shareview_ed");
    edId.getEditor(true).then((editorConsole) => {
      editorConsole.updateOptions({
        readOnly: true,
      });
    });
  }
  urlChange(view, url) {
    const id = this.getParam("x");
    const edId = this.$$(prefix + "_shareview_ed");
    showProgressLoading(edId, 50);
    webix
      .ajax("https://jsonplaceholder.typicode.com/posts/" + id)
      .then((data) => {
        const d = data.json();
        edId.setValue(d.body);
        edId.hideOverlay();
      });
  }
}
