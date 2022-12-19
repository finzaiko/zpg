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
        $$(prefix+"_share_list").clearAll();
        $$(prefix+"_share_list").load(url);
        $$(prefix + "_copy_share_clipboard").hide();
        $$(prefix + "_share_sql").setValue();
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
        if(val.length>0){
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
              id: prefix+"_share_list",
              width: 250,
              template: "<span class='mdi mdi-#icon#'></span> #title#",
              select: true,
              css: "z_generator_list",
              url: url,
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
}
