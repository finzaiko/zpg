import { JetView } from "webix-jet";
import { defaultHeader } from "../../helpers/api";
import { copyToClipboard } from "../../helpers/copy";
import { state, url } from "../../models/Share";
import { LINK_URL } from "../../config/setting";

const prefix = state.prefix;

const toolbar = {
  view: "toolbar",
  elements: [
    {
      view: "button",
      type: "icon",
      id: prefix + "_refresh_btn",
      tooltip: "Refresh",
      css: "zmdi_padding",
      icon: "mdi mdi-sync z_primary_color",
      autowidth: true,
      click: function () {
        reload();
      },
    },
    {
      view: "text",
      id: prefix + "_edit_title",
      hidden: true,
    },
    {
      view: "button",
      type: "icon",
      css: "zmdi_padding",
      id: prefix + "_edit_btn",
      hidden: true,
      tooltip: "Edit",
      icon: "mdi mdi-pencil-box-outline z_primary_color",
      autowidth: true,
      click: function () {
        this.hide();
        $$(prefix + "_save_btn").show();
        $$(prefix + "_cancel_btn").show();
        $$(prefix + "_edit_title").show();
        setTimeout(() => $$(prefix + "_edit_title").focus(), 500);
      },
    },
    {
      view: "button",
      type: "icon",
      css: "zmdi_padding",
      id: prefix + "_save_btn",
      hidden: true,
      tooltip: "Edit",
      icon: "mdi mdi-content-save-outline z_primary_color",
      autowidth: true,
      click: function () {
        // webix.message({ text: "Not implement yet!", type: "debug" });
        update();
      },
    },
    {
      view: "button",
      type: "icon",
      css: "zmdi_padding",
      id: prefix + "_cancel_btn",
      hidden: true,
      tooltip: "Cancel Edit",
      icon: "mdi mdi-close z_primary_color",
      autowidth: true,
      click: function () {
        defaultBtn();
      },
    },
    {
      view: "button",
      type: "icon",
      css: "zmdi_padding",
      id: prefix + "_delete_btn",
      hidden: true,
      tooltip: "Delete",
      icon: "mdi mdi-delete-outline z_primary_color",
      autowidth: true,
      click: function () {
        confirmRemove();
      },
    },
    { width: 10 },
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
    {},
    {
      view: "label",
      label: "",
      id: prefix + "_by_user",
      width: 200,
      align: "right",
      css: "z_label_normal",
    },
    {
      view: "icon",
      icon: "mdi mdi-link-variant z_primary_color",
      tooltip: "Copy link",
      id: prefix + "_copy_link_btn",
      hidden: true,
      click: function () {
        const tblId = $$(prefix + "_share_list");
        const item = tblId.getItem(tblId.getSelectedId());
        if (item) {
          webix.html.addCss(
            $$(prefix + "_copy_link_btn").getNode(),
            "blink_me"
          );
          copyToClipboard(`${LINK_URL}/#!/shareview?x=${item.ukey}`);
          setTimeout(() => {
            webix.html.removeCss(
              $$(prefix + "_copy_link_btn").$view,
              "blink_me"
            );
          }, 2000);
        }
      },
    },
    {
      view: "icon",
      icon: "mdi mdi-open-in-new z_primary_color",
      tooltip: "Open in new window",
      id: prefix + "_open_newin_btn",
      css: "z_icon_size_17",
      hidden: true,
      click: function () {
        const tblId = $$(prefix + "_share_list");
        const item = tblId.getItem(tblId.getSelectedId());
        if (item) {
          window.open(`${LINK_URL}/#!/shareview?x=${item.ukey}`, "_blank");
        }
      },
    },
    { width: 10 },
  ],
};

function update() {
  const tblId = $$(prefix + "_share_list");
  const item = tblId.getItem(tblId.getSelectedId());
  const data = {
    title: $$(prefix + "_edit_title").getValue(),
  };
  webix
    .ajax()
    .headers(defaultHeader())
    .put(`${url}/${item.id}`, data, function (res) {
      webix.message({ text: "Title updated", type: "success" });
      reload();
    })
    .fail(function (err) {
      showError(err);
    });
}

function setRead(isRead) {
  const tblId = $$(prefix + "_share_list");
  let selId = tblId.getSelectedId();
  const item = tblId.getItem(selId);
  if (item.is_read == isRead) return;
  const data = {
    is_read: isRead,
  };
  webix
    .ajax()
    .headers(defaultHeader())
    .put(`${url}/read/${item.id}`, data, function (res) {
      $$(prefix + "_share_list").clearAll();
      $$(prefix + "_share_list")
        .load(url)
        .then((_) => {
          tblId.select(selId);
        });
    })
    .fail(function (err) {
      showError(err);
    });
}

function confirmRemove() {
  webix
    .ui({
      view: "window",
      id: prefix + "_del_confirm",
      head: { height: 4 },
      css: "z_confirm_del_head",
      modal: true,
      position: "center",
      body: {
        padding: 10,

        rows: [
          {
            view: "label",
            label: "Are you sure to delete ?",
            align: "center",
          },
          {
            cols: [
              {},
              {
                view: "button",
                value: "Delete for me",
                css: "webix_primary",
                autowidth: true,
                click: function () {
                  remove();
                  $$(prefix + "_del_confirm").close();
                },
              },
              {
                view: "button",
                value: "Delete for everyone",
                autowidth: true,
                click: function () {
                  remove(true);
                  $$(prefix + "_del_confirm").close();
                },
              },
              {
                view: "button",
                value: "Cancel",
                autowidth: true,
                click: function () {
                  $$(prefix + "_del_confirm").close();
                },
              },
              {},
            ],
          },
        ],
      },
    })
    .show();
}

function remove(isDelAll) {
  const tblId = $$(prefix + "_share_list");
  const item = tblId.getItem(tblId.getSelectedId());
  // -- 0=shared ok, 1=creator deleted, 2=target deleted, 3=both deleted
  let shareStatus = item.is_me == 1 ? 1 : 2;
  if (item.is_me == 1 && item.share_status == 2) {
    shareStatus = 3;
  }
  if ((item.is_me == 0 && item.share_status == 1) || isDelAll) {
    shareStatus = 3;
  }

  webix.ajax().del(`${url}/${shareStatus}/${item.id}`, function (res) {
    webix.message({
      text: `Share deleted`,
      type: "success",
    });
    reload();
  });
}

function reload(isLoadOnly) {
  if (typeof isLoadOnly == "undefined") {
    isLoadOnly = false;
  }

  const tblId = $$(prefix + "_share_list");
  const selId = tblId.getSelectedId();
  const item = tblId.getItem(selId);
  tblId.clearAll();
  tblId.load(url).then((_) => {
    if (item) {
      tblId.select(selId);
    }
  });
  if (!isLoadOnly) {
    $$(prefix + "_share_sql").setValue();
    defaultBtn();
  }
}

function defaultBtn() {
  $$(prefix + "_save_btn").hide();
  $$(prefix + "_edit_btn").hide();
  $$(prefix + "_delete_btn").hide();
  $$(prefix + "_edit_title").hide();
  $$(prefix + "_cancel_btn").hide();
  $$(prefix + "_copy_link_btn").hide();
  $$(prefix + "_open_newin_btn").hide();
  $$(prefix + "_edit_title").setValue();
  $$(prefix + "_copy_share_clipboard").hide();
  $$(prefix + "_by_user").setValue("");
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
              view: "datatable",
              id: prefix + "_share_list",
              width: 250,
              template:
                "<span class='mdi mdi-#icon#'></span> #title# <span class='webix_icon mdi mdi-close z_share_remove_icon' title='Remove'></span>",
              select: true,
              tooltip: "#share_user_label#",
              css: "z_share_list",
              headerRowHeight: -1,
              scheme: {
                $change: function (item) {
                  if (item.is_read == 0 && item.is_me == 0)
                    item.$css = "z_read_bold";
                },
              },
              columns: [
                {
                  fillspace: true,
                  template: function (obj, common, value, column, index) {
                    return `<span class='mdi mdi-${obj.icon}'></span> ${obj.title}`;
                  },
                },
              ],
              url: url,
              on: {
                onItemClick: function (sel) {
                  const item = this.getItem(sel);
                  $$(prefix + "_share_sql").setValue(item.content);
                  $$(prefix + "_copy_share_clipboard").show();
                  $$(prefix + "_save_btn").hide();
                  $$(prefix + "_edit_title").setValue(item.title);
                  $$(prefix + "_copy_link_btn").show();
                  $$(prefix + "_open_newin_btn").show();
                  $$(prefix + "_by_user").setValue(item.share_user_label_flat);

                  if (item.is_me == 1) {
                    $$(prefix + "_edit_btn").show();
                    $$(prefix + "_delete_btn").show();
                  } else {
                    $$(prefix + "_edit_btn").hide();
                    $$(prefix + "_delete_btn").hide();
                  }
                  setRead(1);
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
      on: {
        onViewShow: function () {
          reload(true);
        },
      },
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
  urlChange(view, url) {
    const urlHash = window.location.hash;
    if (urlHash == "#!/share") {
      this.show("/index");
    }
  }
}
