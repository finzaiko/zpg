import { JetView } from "webix-jet";
import { copyToClipboard } from "../helpers/copy";
import { getTextWith, showProgressLoading } from "../helpers/ui";
import { state, url as urlShare } from "../models/Share";

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
          view: "label",
          label: "",
          id: prefix + "_title",
          css: "title_width z_label_normal",
          width: 200,
          // autowidth: true
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

            copyToClipboard($$(prefix + "_shareview_ed").getValue());
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
          id: prefix + "_from_user",
          width: 200,
          align: "right",
          css: "z_label_normal",
        },
        {
          view: "label",
          label: "at: 01-01-2023 10:10:10",
          id: prefix + "_at_time",
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
      .ajax(`${urlShare}/by?field=ukey&value=${id}`)
      .then((data) => {
        const rData = data.json().data[0];
        this.$$(prefix + "_from_user").setValue("from: " + rData.from_user);
        this.$$(prefix + "_at_time").setValue("at: " + rData.created_at);
        this.$$(prefix + "_title").setValue("&#8212; " + rData.title);

        const textWidth = getTextWith(rData.title);
        let t = this.$$(prefix + "_title");
        t.config.width = textWidth;
        t.resize();

        edId.setValue(rData.content);
        edId.hideOverlay();
      })
      .fail(function (err) {
        setTimeout(() => {
          edId.hideOverlay();
          webix.message({
            text: err.status == 404 ? "Share not found" : err.responseText,
            type: "error",
          });
        }, 2000);
      });
  }
}
