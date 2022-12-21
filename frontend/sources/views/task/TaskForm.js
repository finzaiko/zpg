import { JetView } from "webix-jet";
import { defaultHeader } from "../../helpers/api";
import { state, url, urlItem } from "../../models/Task";
import { url as urlDb } from "../../models/Db";
import { userProfile } from "../../models/UserProfile";
import { url as urlProfile } from "../../models/Profile";
import { runTarget } from "./TaskPage";
import { showError } from "../../helpers/ui";

const prefix = state.prefix;

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
    type:"icon",
    icon: "mdi mdi-loading z_mdi_loader"
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
      options: urlProfile + "/content?type=2&ls=true",
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
      icon: "mdi mdi-sync",
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
      autowidth: true,
      click: function () {
        webix.mesage("Not implement yet");
      },
    },
    {
      view: "button",
      type: "icon",
      icon: "mdi mdi-minus",
      css: "zmdi_padding",
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
      options: urlProfile + "/content?type=2&ls=true",
    },
    {
      view: "button",
      type: "icon",
      css: "zmdi_padding",
      icon: "mdi mdi-refresh",
      autowidth: true,
      click: function () {
        reloadTaskItem($$(prefix + "_selected_table"), state.dataSelected.id);
      },
    },
    {
      view: "button",
      type: "icon",
      icon: "mdi mdi-database-sync-outline",
      css: "zmdi_padding",
      tooltip: "Sync from source DB",
      autowidth: true,
      click: function () {
        const panelId = $$(prefix + "_panel_form_item");
        const input = {
          id: state.dataSelected.id,
          source_db_id: $$(prefix + "_source_db_id").getValue(),
        };
        webix.extend(panelId, webix.OverlayBox);
        panelId.showOverlay(
          `
            <div class='transfer-content'>
            <div class="spinner"></div>
            </div>
            `
        );

        webix
          .ajax()
          .post(`${urlItem}/syncselected`, input, function (res) {
            setTimeout(() => panelId.hideOverlay(), 1000);
          })
          .finally(function () {});
      },
    },
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
      icon: "mdi mdi-dots-vertical-circle-outline",
      autowidth: true,
      popup: "my_pop",
      id: prefix + "_more_btn",
      popup: {
        view: "contextmenu",
        data: [
          { id: 1, value: "Check broken files" },
          { id: 2, value: "Clear workspace" },
        ],
        submenuConfig: {
          // width: 100,
        },
        on: {
          onMenuItemClick: function (id) {
            if (id == 1) {
              webix
                .ajax()
                .post(
                  url + "/checkbroken/" + state.dataSelected.id,
                  null,
                  function (res) {
                    const { data } = JSON.parse(res);
                    console.log(`data`, data);
                    let mType = "",
                      mText = "All Ok, no broken files";
                    if (!data.status) {
                      mType = "alert-warning";
                      mText = "Files not found on workspace";
                      if (data.length > 0) {
                        mText = data.replace(/ *, */g, "<br>");
                      }
                    }

                    webix.alert({
                      title: "Checking workspace files",
                      type: mType,
                      text: mText,
                    });
                  }
                );
            }
          },
        },
      },
    },
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
    //           console.log(`data`, data);
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
    { id: "schema", header: ["Schema", { content: "textFilter" }], sort:"string"  },
    {
      id: "name",
      header: ["Name", { content: "textFilter" }],
      fillspace: true, sort:"string"
    },
    { id: "type", header: ["Type", { content: "textFilter" }], adjust: true },
  ],
  on: {
    onAfterDrop: function (context, native_event) {
      updateTask();
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
    { id: "schema", header: ["Schema", { content: "textFilter" }], sort:"string"  },
    {
      id: "name",
      header: ["Name", { content: "textFilter" }],
      fillspace: true, sort:"string"
    },
    { id: "type", header: "Type", adjust: true },
  ],
  on: {
    onItemClick: function () {
      $$(prefix + "_delete_item_btn").show();
    },
    onAfterDrop: function (context, native_event) {
      updateTask();
    },
    onBeforeLoad: function () {
      this.showOverlay("Loading...");
    },
    onAfterLoad: function () {
      this.hideOverlay();
    },
  },
};

function save() {
  if ($$(prefix + "_form").validate()) {
    const data = $$(prefix + "_form").getValues(),
      msgName = `${data.task_name}`;
    data.user_id = userProfile.userId;
    if (!state.isEdit) {
      webix
        .ajax()
        .headers(defaultHeader())
        .post(url, data, function (res) {
          const dataRes = JSON.parse(res);
          console.log(`dataRes`, dataRes);
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
        .headers(defaultHeader())
        .put(`${url}/${data.id}`, data, function (res) {
          webix.message({ text: "<strong>" + msgName + "</strong> updated." });
          // reloadDbConfig();
        })
        .fail(function (err) {
          showError(err);
        });
    }
    // cancel();
  }
}

function updateTask() {
  const data = $$(prefix + "_form").getValues();
  data.source_db_id = $$(prefix + "_source_db_id").getValue();
  data.target_db_id = $$(prefix + "_target_db_id").getValue();
  console.log("data", data);
  const id = $$(prefix + "_task_id").getValue();
  webix
    .ajax()
    .headers(defaultHeader())
    .put(url + "/" + id, data, function (res) {
      // console.log('res', res);
    })
    .fail(function (err) {
      showError(err);
    });
}

function saveItem() {
  let itemData = $$(prefix + "_selected_table").serialize();
  let data = {
    task_id: $$(prefix + "_task_id").getValue(),
    source_db_id: $$(prefix + "_source_db_id").getValue(),
    oid_arr: itemData.map((v) => v.id).join(","),
  };

  console.log("data", data);
  webix
    .ajax()
    .headers(defaultHeader())
    .post(urlItem + "/selected", data, function (res) {
      // console.log('res', res);
      reloadTaskItem($$(prefix + "_selected_table"), data.task_id);
    })
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
              webix.message(`<strong>${msgName} </strong> deleted.`);
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
    type:"icon",
    icon: "mdi mdi-loading z_mdi_loader"
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

export default class TaskForm extends JetView {
  config() {
    return {
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
    console.log(`INIT-url[0].page`, url[0].page);
    console.log(`INIT-url[0].params`, url[0].params);

    if (!state.isEdit) {
      this.$$(prefix + "_add_btn").show();
    } else {
      this.$$(prefix + "_add_btn").hide();
      const dataSel = state.dataSelected;
      this.$$(prefix + "_form").setValues(dataSel);
      // reloadTaskItem($$(prefix + "_selected_table"), dataSel.id);
      $$(prefix + "_panel_form_item").show();
      $$(prefix + "_panel_form_item_empty").hide();
      console.log("dataSel", dataSel);
      this.$$(prefix + "_source_db_id").setValue(dataSel.source_db_id);
      this.$$(prefix + "_target_db_id").setValue(dataSel.target_db_id);
    }
  }
  urlChange(view, url) {
    console.log(`CHANGE-url[0].page`, url[0].page);
    console.log(`CHANGE-url[0].params`, url[0].params);
  }
}

// init(_$view: IBaseView, _$: IJetURL): void;
// ready(_$view: IBaseView, _$url: IJetURL): void;

// init(view, url){
//   console.log(`view`, view);
//   console.log(`url`, url);
// }
