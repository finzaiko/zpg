import { JetView } from "webix-jet";
import { defaultHeader } from "../../helpers/api";
import { state, url, urlItem } from "../../models/Task";
import { url as urlDb } from "../../models/Db";
import { userProfile } from "../../models/UserProfile";
import { url as urlProfile } from "../../models/Profile";
import { downloadTaskContent, runTarget } from "./TaskPage";
import { forceDownload, isColorLight, showError } from "../../helpers/ui";
import { TaskFormRawSQL } from "./TaskFormRawSQL";
import { API_URL } from "../../config/setting";
import { url as urlUser } from "../../models/User";

const prefix = state.prefix + "_form";

// const avCollection = new webix.DataCollection();
let isYes = true;

const loadAvailable = (sourceId) => {
  return webix
    .ajax()
    .get(`${urlDb}/schema_list?id=${sourceId}`, function (res) {
      return res;
    });
};

const loadSelected = (selId) => {
  return webix.ajax().get(`${urlItem}?filter[task_id]=${selId}`);
};

function reloadAvailableFiltered(id, selId) {
  const panelId = $$(prefix + "_panel_form_item");
  webix.extend(panelId, webix.ProgressBar);
  panelId.showProgress({
    type: "icon",
    icon: "mdi mdi-loading z_mdi_loader",
  });
  panelId.disable();
  loadAvailable(id).then((rAv) => {
    loadSelected(selId).then((rSel) => {
      const av = rAv.json().data,
        sel = rSel.json().data;
      const avFiltered = av.filter(
        (x) => !sel.filter((y) => y.oid === x.id).length
      );
      const tbl = $$(prefix + "_avalaible_table");
      tbl.clearAll();
      tbl.parse(avFiltered);
      // avCollection.parse(avFiltered);

      const tblSel = $$(prefix + "_selected_table");
      tblSel.clearAll();
      tblSel.parse(sel);

      panelId.hideProgress();
      panelId.enable();
    });
  });
}
const availableToolbar = {
  view: "toolbar",
  elements: [
    {
      view: "combo",
      label: "Source",
      id: prefix + "_source_db_id",
      name: "source_db_id",
      labelWidth: 60,
      width: 300,
      placeholder: "db name",
      options: {
        width: 250,
        fitMaster: false,
        body: {
          template: function (obj) {
            let clr = "#475466",
              bg = "#ffffff";
            if (obj.content) {
              bg = obj.content;
            }
            if (!isColorLight(bg)) {
              clr = "#ffffff";
            }
            return `<div style="background-color:${obj.content};color:${clr};border-radius:3px;padding-left:4px;padding-right:4px;">${obj.value}</div>`;
          },
          url: `${urlProfile}/content?type=2&ls=true`,
        },
      },
      on: {
        onChange: function (v) {
          // reloadAvailable(v);
          reloadAvailableFiltered(v, state.dataSelected.id);
        },
      },
    },
    {
      view: "button",
      type: "icon",
      icon: "mdi mdi-refresh",
      css: "zmdi_padding",
      tooltip: "Refresh source",
      autowidth: true,
      click: function () {
        reloadAvailableFiltered(
          $$(prefix + "_source_db_id").getValue(),
          state.dataSelected.id
        );
      },
    },
    {
      view: "button",
      type: "icon",
      icon: "mdi mdi-chevron-right",
      css: "zmdi_padding",
      tooltip: "Add selected item",
      disabled: true,
      autowidth: true,
    },
  ],
};

const selectedToolbar = {
  view: "toolbar",
  elements: [
    {
      view: "button",
      type: "icon",
      icon: "mdi mdi-plus",
      css: "zmdi_padding",
      id: prefix + "_add_item_btn",
      tooltip: "Add raw SQL task item",
      autowidth: true,
      click: function () {
        state.isEditItem = false;
        this.$scope.ui(TaskFormRawSQL).show();
      },
    },
    {
      view: "button",
      type: "icon",
      icon: "mdi mdi-minus",
      css: "zmdi_padding",
      tooltip: "Delete task item",
      id: prefix + "_delete_item_btn",
      autowidth: true,
      hidden: true,
      click: function () {
        remove();
      },
    },
    {
      view: "button",
      type: "icon",
      icon: "mdi mdi-content-save-outline",
      css: "zmdi_padding",
      id: prefix + "_save_btn",
      tooltip: "Save Task",
      autowidth: true,
      click: function () {
        saveItem();
      },
    },
    {
      view: "combo",
      label: "Target",
      labelWidth: 60,
      name: "target_db_id",
      id: prefix + "_target_db_id",
      width: 300,
      placeholder: "db name",
      options: {
        width: 250,
        fitMaster: false,
        body: {
          template: function (obj) {
            let clr = "#475466",
              bg = "#ffffff";
            if (obj.content) {
              bg = obj.content;
            }
            if (!isColorLight(bg)) {
              clr = "#ffffff";
            }
            return `<div style="background-color:${obj.content};color:${clr};border-radius:3px;padding-left:4px;padding-right:4px;">${obj.value}</div>`;
          },
          url: `${urlProfile}/content?type=2&ls=true`,
        },
      },
    },
    {
      view: "button",
      type: "icon",
      css: "zmdi_padding",
      icon: "mdi mdi-refresh",
      tooltip: "Refresh Selected",
      autowidth: true,
      click: function () {
        reloadTaskItem($$(prefix + "_selected_table"), state.dataSelected.id);
      },
    },
    // {
    //   view: "button",
    //   type: "icon",
    //   icon: "mdi mdi-database-sync-outline",
    //   css: "zmdi_padding",
    //   tooltip: "Sync from source DB",
    //   autowidth: true,
    //   click: function () {
    //     const panelId = $$(prefix + "_panel_form_item");
    //     const input = {
    //       id: state.dataSelected.id,
    //       source_db_id: $$(prefix + "_source_db_id").getValue(),
    //     };
    //     webix.extend(panelId, webix.OverlayBox);
    //     panelId.showOverlay(
    //       `
    //         <div class='transfer-content'>
    //         <div class="spinner"></div>
    //         </div>
    //         `
    //     );

    //     webix
    //       .ajax()
    //       .post(`${urlItem}/syncselected`, input, function (res) {
    //         setTimeout(() => panelId.hideOverlay(), 1000);
    //       })
    //       .finally(function () {});
    //   },
    // },
    {
      view: "button",
      type: "icon",
      css: "zmdi_padding",
      icon: "mdi mdi-chevron-triple-right",
      id: prefix + "_run_btn",
      tooltip: "Run Target",
      autowidth: true,
      click: function () {
        runTarget();
      },
    },
    {
      view: "button",
      type: "icon",
      css: "zmdi_padding",
      // icon: "mdi mdi-swap-vertical",
      // icon: "mdi mdi-not-equal",
      icon: "mdi mdi-format-list-checks",
      id: prefix + "_toggle_dropreplace_btn",
      tooltip: "Toggle All Drop Replace",
      autowidth: true,
      click: function () {
        updateToggleDropReplace();
      },
    },
    {
      view: "button",
      type: "icon",
      css: "zmdi_padding",
      icon: "mdi mdi-download-outline",
      id: prefix + "_download_btn",
      autowidth: true,
      tooltip: "Download SQL script",
      click: function () {
        downloadTaskContent();
      },
    },
    {
      view: "button",
      type: "icon",
      css: "zmdi_padding",
      icon: "mdi mdi-account-multiple-check",
      id: prefix + "_users_share_btn",
      autowidth: true,
      tooltip: "Access users",
      click: function () {
        openAccessUser();
      },
    },
    // {
    //   view: "button",
    //   type: "icon",
    //   css: "zmdi_padding",
    //   icon: "mdi mdi-dots-vertical-circle-outline",
    //   autowidth: true,
    //   popup: "my_pop",
    //   id: prefix + "_more_btn",
    //   popup: {
    //     view: "contextmenu",
    //     data: [
    //       { id: 1, value: "Check broken files" },
    //       { id: 2, value: "Clear workspace" },
    //     ],
    //     submenuConfig: {
    //       // width: 100,
    //     },
    //     on: {
    //       onMenuItemClick: function (id) {
    //         if (id == 1) {
    //           webix
    //             .ajax()
    //             .post(
    //               url + "/checkbroken/" + state.dataSelected.id,
    //               null,
    //               function (res) {
    //                 const { data } = JSON.parse(res);
    //                 let mType = "",
    //                   mText = "All Ok, no broken files";
    //                 if (!data.status) {
    //                   mType = "alert-warning";
    //                   mText = "Files not found on workspace";
    //                   if (data.length > 0) {
    //                     mText = data.replace(/ *, */g, "<br>");
    //                   }
    //                 }

    //                 webix.alert({
    //                   title: "Checking workspace files",
    //                   type: mType,
    //                   text: mText,
    //                 });
    //               }
    //             );
    //         }
    //       },
    //     },
    //   },
    // },
    // {
    //   view: "button",
    //   type: "icon",
    //   icon: "mdi mdi-timeline-check-outline",
    //   tooltip: "Cheking broken SQL script",
    //   autowidth: true,
    //   click: function () {
    //     webix
    //       .ajax()
    //       .post(
    //         url + "/checkbroken/" + state.dataSelected.id,
    //         null,
    //         function (res) {
    //           const { data } = JSON.parse(res);
    //           let mType = "",
    //             mText = "All Ok, no broken files";
    //           if (!data.status) {
    //             mType = "alert-warning";
    //             mText = "Files not found on workspace";
    //             if (data.length > 0) {
    //               mText = data.replace(/ *, */g, "<br>");
    //             }
    //           }

    //           webix.alert({
    //             title: "Checking workspace files",
    //             type: mType,
    //             text: mText,
    //           });
    //         }
    //       )
    //   },
    // },
  ],
};

const form = {
  rows: [
    {
      view: "form",
      id: prefix + "_form",
      height: 50,
      elements: [
        {
          cols: [
            { view: "text", label: "Task Name", name: "task_name", width: 300 },
            { view: "text", name: "id", id: prefix + "_task_id", hidden: true },
            {
              view: "icon",
              icon: "mdi mdi-dots-vertical",
              tooltip: "add description",
              click: function () {
                const noteId = $$(prefix + "_note");
                if (noteId.isVisible()) {
                  noteId.hide();
                  $$(prefix + "_form_space").show();
                } else {
                  noteId.show();
                  $$(prefix + "_form_space").hide();
                }
              },
            },
            {
              view: "text",
              id: prefix + "_note",
              placeholder: "Description",
              name: "note",
              hidden: true,
            },
            {
              view: "button",
              value: "Add",
              autowidth: true,
              id: prefix + "_add_btn",
              click: function () {
                save();
              },
            },

            { id: prefix + "_form_space" },
            {
              view: "icon",
              icon: "mdi mdi-close",
              tooltip: "Close",
              click: function () {
                // this.$scope.show('/p/task');
                this.$scope.show("task.page", { target: "z_task_page" });
              },
            },
            { width: 10 },
          ],
        },
        {},
      ],
      rules: {
        task_name: webix.rules.isNotEmpty,
      },
      on: {
        onAfterValidation: function (result, value) {
          if (!result) {
            var text = [];
            for (var key in value) {
              if (key == "task_name") text.push("Task Name can't be empty");
            }
            webix.message({ type: "error", text: text.join("<br>") });
          }
        },
      },
    },
  ],
};

const availableList = {
  view: "datatable",
  id: prefix + "_avalaible_table",
  resizeColumn: true,
  scrollX: true,
  select: "multiselect",
  multiselect: "touch",
  drag: true,
  select: "row",
  columns: [
    {
      id: "schema",
      header: ["Schema", { content: "textFilter" }],
      sort: "string",
    },
    {
      id: "name",
      header: ["Name", { content: "textFilter" }],
      fillspace: true,
      sort: "string",
    },
    { id: "type", header: ["Type", { content: "textFilter" }], adjust: true },
  ],
  on: {
    onAfterDrop: function (context, native_event) {
      updateTask();
      reloadTaskItem($$(prefix + "_selected_table"), state.dataSelected.id);
      webix.message({
        text: "Disable to drop, use remove button",
        type: "debug",
      });
    },
    onBeforeLoad: function () {
      this.showOverlay("Loading...");
    },
    onAfterLoad: function () {
      this.hideOverlay();
    },
  },
};

const selectedList = {
  view: "datatable",
  id: prefix + "_selected_table",
  resizeColumn: true,
  scrollX: true,
  select: "multiselect",
  multiselect: "touch",
  drag: true,
  columns: [
    {
      id: "schema",
      header: ["Schema", { content: "textFilter" }],
      sort: "string",
    },
    {
      id: "name",
      header: ["Name", { content: "textFilter" }],
      fillspace: true,
      sort: "string",
    },
    { id: "type", header: ["Type", { content: "textFilter" }], adjust: true },
    {
      id: "is_execreplace",
      header: [
        "Drop Replace",
        {
          content: "selectFilter",
          options: [
            { id: "0", value: "No" },
            { id: "1", value: "Yes" },
          ],
        },
      ],
      adjust: true,
      // cssFormat: yesNoStatus,
      template: function (obj) {
        if (obj.is_execreplace != null) {
          if (obj.type != 9) {
            if (obj.is_execreplace == 0) {
              return `<span class="xreplace_task z_hover_text" style="color:#d9d9d9">No</span>`;
            } else if (obj.is_execreplace == 1) {
              return `<span class="xreplace_task z_hover_text">Yes</span>`;
            } else if (obj.is_execreplace == 9) {
              // loading icon
              return `<span class="mdi mdi-spin mdi-autorenew"></span>`;
            } else {
              return "";
            }
          } else {
            return "";
          }
        } else {
          return "";
        }
      },
    },
    {
      id: "is_active",
      header: [
        "Active",
        {
          content: "selectFilter",
          options: [
            { id: "0", value: "No" },
            { id: "1", value: "Yes" },
          ],
        },
      ],
      adjust: true,
      template: function (obj) {
        if (obj.is_active != null) {
          //   return obj.is_active == 0
          //     ? `<span class="active_task z_hover_text" style="color:#d9d9d9">No</span>`
          //     : `<span class="active_task z_hover_text">Yes</span>`;
          // } else {
          //   return "";
          if (obj.is_active == 0) {
            return `<span class="active_task z_hover_text" style="color:#d9d9d9">No</span>`;
          } else if (obj.is_active == 1) {
            return `<span class="active_task z_hover_text">Yes</span>`;
          } else if (obj.is_active == 9) {
            // loading icon
            return `<span class="mdi mdi-spin mdi-autorenew"></span>`;
          } else {
            return "";
          }
        } else {
          return "";
        }
      },
    },
  ],
  onClick: {
    xreplace_task: function (e, id) {
      changeStatusToggle(id, "is_execreplace");
    },
    active_task: function (e, id) {
      changeStatusToggle(id, "is_active");
    },
  },
  on: {
    onItemClick: function (sel) {
      state.dataSelectedItem = this.getItem(sel);

      $$(prefix + "_delete_item_btn").show();
    },
    onItemDblClick: function (sel) {
      const item = this.getItem(sel);
      if (item.type == 9) {
        state.isEditItem = true;
        this.$scope.ui(TaskFormRawSQL).show();
      }
    },
    onAfterDrop: function (context, native_event) {
      updateTask();
      updateQue(this);
    },
    onBeforeLoad: function () {
      this.showOverlay("Loading...");
    },
    onAfterLoad: function () {
      this.hideOverlay();
    },
  },
};

function changeStatusToggle(id, fieldName) {
  const tbl = $$(prefix + "_selected_table");
  const item = tbl.getItem(id);
  let newVal = !item[fieldName];

  let fieldValue = {};
  fieldValue[fieldName] = 9;
  tbl.updateItem(id, fieldValue); // 9= show loading
  tbl.refresh(id);
  setTimeout(() => tbl.unselect(id, 500));
  webix
    .ajax()
    .post(
      urlItem + "/change",
      { id: id.row, field_name: fieldName, field_value: newVal },
      (res) => {
        setTimeout(() => {
          fieldValue[fieldName] = newVal;
          tbl.updateItem(id, fieldValue);
          syncItem().then((_) => {});
          tbl.refresh(id);
        }, 800);
      }
    )
    .fail(function (err) {
      showError(err);
    });
}

function yesNoStatus(value, config) {
  if (value == 0) {
    return { color: "#d9d9d9" };
  }
}

function save() {
  if ($$(prefix + "_form").validate()) {
    const data = $$(prefix + "_form").getValues(),
      msgName = `${data.task_name}`;
    data.user_id = userProfile.userId;
    if (!state.isEdit) {
      webix
        .ajax()
        .post(url, data, function (res) {
          const dataRes = JSON.parse(res);
          $$(prefix + "_task_id").setValue(dataRes.data.last_id);
          if (dataRes.data.last_id) {
            $$(prefix + "_panel_form_item").show();
            $$(prefix + "_panel_form_item_empty").hide();
          } else {
            $$(prefix + "_panel_form_item").hide();
            $$(prefix + "_panel_form_item_empty").show();
          }
          // reloadDbConfig();
        })
        .fail(function (err) {
          showError(err);
        });
    } else {
      webix
        .ajax()

        .put(`${url}/${data.id}`, data, function (res) {
          webix.message({
            text: `<strong>${msgName}</strong> updated.`,
            type: "success",
          });
          // reloadDbConfig();
        })
        .fail(function (err) {
          showError(err);
        });
    }
    // cancel();
  }
}

function openAccessUser() {
  webix
    .ui({
      view: "window",
      modal: true,
      id: prefix + "_win_share_user",
      width: 300,
      height: 350,
      position: "center",
      move: true,
      head: {
        view: "toolbar",
        cols: [
          { view: "label", label: "Other user access" },
          {
            view: "icon",
            icon: "mdi mdi-close",
            tooltip: "Close me",
            align: "right",
            click: function () {
              $$(prefix + "_win_share_user").destructor();
            },
          },
        ],
      },
      body: {
        rows: [
          {
            cols: [
              {
                view: "combo",
                id: prefix + "_user_access_cmb",
                label: "User",
                labelWidth: 35,
                options: {
                  url: `${urlUser}/users?type=6`,
                  body: {
                    template: "#fullname#",
                    // yCount: 7,
                    on: {
                      onLoadError: function (err) {
                        showError(err);
                      },
                    },
                  },
                },
              },
              {
                view: "button",
                type: "icon",
                icon: "mdi mdi-plus",
                css: "webix_primary zmdi_padding",
                autowidth: true,
                click: function () {
                  const data = {
                    task_id: state.dataSelected.id,
                    user_id: $$(prefix + "_user_access_cmb").getValue(),
                  };
                  webix
                    .ajax()
                    .post(`${url}/useraccess`, data, function (res) {
                      webix.message({ text: "User added", type: "success" });
                      loadAccessUser();
                    })
                    .fail(function (err) {
                      showError(err);
                    });
                },
              },
            ],
          },
          {
            id: prefix + "_usershare_table",
            view: "datatable",
            css: "z_usershare_table",
            columns: [{ id: "fullname", header: "Name", fillspace: true }],
            select: "row",
            multiselect: true,
          },
        ],
      },
      on: {
        onShow: function () {
          loadAccessUser();
        },
      },
    })
    .show();
}

function loadAccessUser() {
  const tbl = $$(prefix + "_usershare_table");
  tbl
    .load(
      `${url}/useraccessfield?field_name=task_id&field_value=${state.dataSelected.id}`
    )
    .then((_) => {
      let ids = tbl.serialize().map((o) => o.user_id);
      ids.push(userProfile.userId);
      if ($$(prefix + "_user_access_cmb")) {
        const cmbId = $$(prefix + "_user_access_cmb");
        const filterCombo = cmbId.getPopup().getList();
        filterCombo.clearAll();
        cmbId.setValue("");
        cmbId.getPopup().getList().unselect();
        filterCombo.load(`${urlUser}/users?type=6&except=${ids.join()}`);
      }
    });
}
function updateTask() {
  const data = $$(prefix + "_form").getValues();
  data.source_db_id = $$(prefix + "_source_db_id").getValue();
  data.target_db_id = $$(prefix + "_target_db_id").getValue();
  const id = $$(prefix + "_task_id").getValue();
  webix
    .ajax()

    .put(url + "/" + id, data, function (res) {})
    .fail(function (err) {
      showError(err);
    });
}

function saveItem() {
  const tblId = $$(prefix + "_selected_table");
  let itemData = tblId.serialize();
  const sData = itemData.map((x, i) => {
    x["seq"] = i + 1;
    return x;
  });
  let data = {
    task_id: $$(prefix + "_task_id").getValue(),
    source_db_id: $$(prefix + "_source_db_id").getValue(),
    oid_arr: JSON.stringify(sData),
  };
  webix
    .ajax()
    .post(urlItem + "/selected", data, function (res) {
      updateTask();
      updateQue(tblId);
      reloadTaskItem(tblId, data.task_id);
      syncItem().then((_) => {});
    })
    .fail(function (err) {
      showError(err);
    });
}

export function syncItem() {
  let itemData = [];
  if ($$(state.prefix + "_item_table")) {
    itemData = $$(state.prefix + "_item_table").serialize();
  } else {
    itemData = $$(prefix + "_selected_table").serialize();
  }

  const sData = itemData.map((x, i) => {
    x["seq"] = i + 1;
    return x;
  });
  let sourceId = 0;
  if ($$(prefix + "_source_db_id")) {
    sourceId = $$(prefix + "_source_db_id").getValue();
  } else {
    sourceId = state.dataSelected.source_db_id;
  }
  let data = {
    task_id: state.dataSelected.id,
    source_db_id: sourceId,
    oid_arr: JSON.stringify(sData),
  };
  return webix
    .ajax()
    .post(urlItem + "/sync", data, (res) => res)
    .fail(function (err) {
      showError(err);
    });
}

function reloadAvailable(id) {
  const tbl = $$(prefix + "_avalaible_table");
  tbl.clearAll();
  tbl.load(`${urlDb}/schema_list?id=${id}`);
}

const remove = () => {
  const dt = $$(prefix + "_selected_table"),
    msgName = "Selected item";
  let ids = dt.getSelectedId();
  if (ids) {
    if (Array.isArray(ids)) {
      ids = dt
        .getSelectedId()
        .map((v) => v.id)
        .join(",");
    } else {
      ids = ids.id;
    }
    webix.confirm({
      ok: "Yes",
      cancel: "No",
      text: "Are you sure to delete: <strong>" + msgName + "</strong> ?",
      callback: function (result) {
        if (result) {
          webix
            .ajax()
            .post(urlItem + "/rmselected", { sid: ids }, function (res) {
              webix.message({
                text: `<strong>${msgName} </strong> deleted.`,
                type: "success",
              });
              reloadTaskItem(dt, state.dataSelected.id);
            });
        }
      },
    });
  }
};

// export func/var -----------------

export function reloadTaskItem(viewId, selId) {
  webix.extend(viewId, webix.ProgressBar);
  viewId.showProgress({
    type: "icon",
    icon: "mdi mdi-loading z_mdi_loader",
  });
  viewId.disable();
  loadSelected(selId).then((rSel) => {
    viewId.clearAll();
    viewId.parse(rSel.json());
    viewId.enable();
    viewId.hideProgress();
  });
  // viewId.load(`${urlItem}_filter?field=task_id&value=${id}`);
  // viewId.load(`${urlItem}?filter[task_id]=${id}`);
}

function updateQue(_this) {
  let i = 0,
    arr = [];
  _this.eachRow(function (row) {
    i++;
    arr.push({ id: row, seq: i });
  });

  webix
    .ajax()
    .post(urlItem + "/que", {
      task_id: state.dataSelected.id,
      data: JSON.stringify(arr),
    })
    .fail(function (err) {
      showError(err);
    });
}

function updateToggleDropReplace() {
  webix
    .ajax()
    .post(
      urlItem + "/toggledr",
      {
        task_id: state.dataSelected.id,
        is_yes: +isYes,
      },
      function (_) {
        isYes = !isYes;
        reloadTaskItem($$(prefix + "_selected_table"), state.dataSelected.id);
      }
    )
    .fail(function (err) {
      showError(err);
    });
}

export default class TaskForm extends JetView {
  config() {
    return {
      id: prefix + "_page_panel_item",
      rows: [
        form,
        {
          id: prefix + "_panel_form_item",
          hidden: true,
          cols: [
            {
              rows: [availableToolbar, availableList],
            },
            {
              view: "resizer",
              css: "z_resizer_small",
            },

            {
              gravity: 2,
              rows: [selectedToolbar, selectedList],
            },
          ],
        },
        {
          id: prefix + "_panel_form_item_empty",
          template: "&nbsp;",
        },
      ],
    };
  }
  init(view, url) {
    if (!state.isEdit) {
      this.$$(prefix + "_add_btn").show();
    } else {
      this.$$(prefix + "_add_btn").hide();
      const dataSel = state.dataSelected;

      this.$$(prefix + "_form").setValues(dataSel);
      $$(prefix + "_panel_form_item").show();
      $$(prefix + "_panel_form_item_empty").hide();
      this.$$(prefix + "_source_db_id").setValue(dataSel.source_db_id);
      this.$$(prefix + "_target_db_id").setValue(dataSel.target_db_id);
    }
  }
  destructor() {
    state.isEditItem = false;
    state.dataSelectedItem = {};
  }
}
