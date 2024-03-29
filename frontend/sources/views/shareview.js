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
          css: "title_width z_label_normal_white",
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
            `<span class="mdi mdi-check-bold blink_me" style="font-size:16px;"></span>`
        },
        {},
        {
          view: "label",
          label: "",
          id: prefix + "_by_user",
          width: 300,
          align: "right",
          css: "z_label_normal_white",
        },
        { width: 10 },
      ],
    };

    return {
      rows: [
        {
          view: "template",
          id: prefix + "_empty_panel",
          template:
            "<div style='text-align:center;margin-top:37%;font-size: 18px;color:#ddaa88;'>ZPG share</div>",
        },
        {
          view: "template",
          id: prefix + "_un_authorized",
          template:
            "<div style='color:red;padding: 10px;'>ZPG share: Unauthorized user</div>",
          hidden: true,
        },
        {
          id: prefix + "_authorized",
          hidden: true,
          rows: [
            navbar,
            {
              view: "monaco-editor",
              id: prefix + "_shareview_ed",
              language: "sql",
              fontSize: "12px",
            },
          ],
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
    document.title = "ZPG share";
  }
  urlChange(view, url) {
    const id = this.getParam("x");
    const edId = this.$$(prefix + "_shareview_ed");
    showProgressLoading(edId, 50);
    this.checkRole(id).then((r) => {
      this.$$(prefix + "_empty_panel").hide();
      this.$$(prefix + "_un_authorized").hide();
      this.$$(prefix + "_authorized").show();
      if (r > 0) {
        webix
          .ajax(`${urlShare}/by?field=ukey&value=${id}`)
          .then((data) => {
            const rData = data.json().data[0];
            this.$$(prefix + "_by_user").setValue(rData.share_user_label_flat);
            this.$$(prefix + "_title").setValue("&#8212; " + rData.title);

            const textWidth = getTextWith(rData.title);
            let t = this.$$(prefix + "_title");
            t.config.width = textWidth;
            t.resize();

            if (rData.is_read != 1 && rData.is_me == 0) {
              this.setReadView(rData.id);
            }

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
      } else {
        edId.hideOverlay();
        this.$$(prefix + "_empty_panel").hide();
        this.$$(prefix + "_authorized").hide();
        this.$$(prefix + "_un_authorized").show();
      }
    });
  }

  checkRole(ukey) {
    return webix
      .ajax(`${urlShare}/viewverify?ukey=${ukey}`)
      .then((data) => {
        return data.json().data;
      })
      .fail(function (err) {
        return 0;
      });
  }

  setReadView(id) {
    const data = {
      is_read: 1,
    };
    webix
      .ajax()
      .put(`${url}/read/${id}`, data)
      .fail(function (err) {
        showError(err);
      });
  }
}
