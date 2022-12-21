import { JetView } from "webix-jet";
import { copyToClipboard } from "../../helpers/copy";
import { state, url } from "../../models/Share";

const prefix = state.prefix;

const toolbar = {
  view: "toolbar",
  elements: [
    {
      view: "icon",
      id: prefix + "_refresh_btn",
      tooltip: "Refresh",
      icon: "mdi mdi-sync z_primary_color",
      autowidth: true,
      click: function () {
        reload();
      },
    },
    {
      view: "icon",
      icon: "mdi mdi-content-copy",
      autowidth: true,
      id: prefix + "_copy_share_clipboard",
      hidden: true,
      tooltip: "Copy result to clipboard",
      css: "z_icon_color_primary z_icon_size_17",
      click: function () {
        const val = $$(prefix + "_share_sql").getValue();
        if (val.length > 0) {
          this.hide();
          const ck = $$(prefix + "_copy_share_clipboard_done");
          ck.show();
          setTimeout(() => {
            this.show();
            ck.hide();
          }, 1500);

          copyToClipboard(val);
        }
      },
    },
    {
      view: "template",
      autowidth: true,
      hidden: true,
      width: 31,
      css: { "padding-top": "3px" },
      borderless: true,
      id: prefix + "_copy_share_clipboard_done",
      template:
        '<svg class="animated-check" viewBox="0 0 24 24"><path d="M4.1 12.7L9 17.6 20.3 6.3" fill="none"/></svg>',
    },
  ],
};

function reload() {
  $$(prefix + "_share_list").clearAll();
  $$(prefix + "_share_list").load(url);
  $$(prefix + "_copy_share_clipboard").hide();
  $$(prefix + "_share_sql").setValue();
}

export default class SharePage extends JetView {
  config() {
    return {
      id: "z_share_page",
      rows: [
        toolbar,
        {
          cols: [
            {
              view: "list",
              id: prefix + "_share_list",
              width: 250,
              template:
                "<span class='mdi mdi-#icon#'></span> #title# <span class='webix_icon mdi mdi-close z_share_remove_icon' title='Remove'></span>",
              select: true,
              tooltip: "#share_user_label#",
              css: "z_share_list",
              url: url,
              onClick: {
                z_share_remove_icon: function (ev, id) {
                  const _this = this;
                  webix.confirm({
                    ok: "Yes",
                    cancel: "No",
                    text: "Are you sure to delete ?",
                    callback: function (result) {
                      const item = _this.getItem(id);
                      if (result) {
                        // -- 0=shared ok, 1=creator deleted, 2=target deleted, 3=both deleted
                        let shareStatus = item.is_me == 1 ? 1 : 2;
                        if (item.is_me == 1 && item.share_status == 2) {
                          shareStatus = 3;
                        }
                        if (item.is_me == 0 && item.share_status == 1) {
                          shareStatus = 3;
                        }
                        webix
                          .ajax()
                          .del(`${url}/${shareStatus}/${id}`, function (res) {
                            webix.message({
                              text: `Share deleted`,
                              type: "success",
                            });
                            reload();
                          });
                      }
                    },
                  });
                  return false;
                },
              },
              on: {
                onItemClick: function (sel) {
                  const item = this.getItem(sel);
                  $$(prefix + "_share_sql").setValue(item.content);
                  $$(prefix + "_copy_share_clipboard").show();
                },
              },
            },
            {
              rows: [
                {
                  view: "monaco-editor",
                  css: "z_console_editor",
                  id: prefix + "_share_sql",
                  lineNumbers: "off",
                  fontSize: "12px",
                  renderLineHighlight: "none",
                },
              ],
            },
          ],
        },
      ],
    };
  }
  init() {}
  ready() {
    const edId = $$(prefix + "_share_sql");
    edId.getEditor(true).then((editor) => {
      editor.updateOptions({
        readOnly: true,
      });
    });
  }
}
