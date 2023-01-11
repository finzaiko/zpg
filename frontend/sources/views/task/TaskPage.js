import { JetView } from "webix-jet";
import { API_URL } from "../../config/setting";
import { defaultHeader } from "../../helpers/api";
import { state, url } from "../../models/Task";
import { getToken, userProfile } from "../../models/UserProfile";
import { reloadTaskItem } from "./TaskForm";

const prefix = "task";

const taskToolbar = {
  view: "toolbar",
  elements: [
    {
      view: "button",
      type: "icon",
      css: "zmdi_padding",
      icon: "mdi mdi-plus",
      autowidth: true,
      click: function () {
        openForm(this.$scope, false);
      },
    },
    {
      view: "button",
      type: "icon",
      css: "zmdi_padding",
      icon: "mdi mdi-pencil-outline",
      id: prefix + "_edit_btn",
      autowidth: true,
      hidden: true,
      click: function () {
        openForm(this.$scope, true);
      },
    },
    {
      view: "button",
      type: "icon",
      css: "zmdi_padding",
      id: prefix + "_delete_btn",
      icon: "mdi mdi-minus",
      autowidth: true,
      hidden: true,
      click: function () {
        remove();
      },
    },
    {
      view: "text",
      placeholder: "search",
      width: 200,
    },
    {
      view: "button",
      type: "icon",
      css: "zmdi_padding",
      icon: "mdi mdi-refresh",
      id: prefix + "_refresh_btn",
      autowidth: true,
      click: function () {
        reloadTask();
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
      hidden: true,
      click: function () {
        runTarget();
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
      hidden: true,
      click: function () {
        // http://localhost:5000/api/task_run?id=20&download=true
        // webix.extend($$(prefix + "_page_panel"), webix.OverlayBox);
        // const item = state.dataSelected;
        // $$(prefix + "_page_panel").showOverlay(
        //   `
        //     <div class='loading-content'>
        //     <div class="spinner"></div>
        //     <iframe id="downlaod_iframe" style="display: none;" onload="${closeDownloadFrame(this)}"></iframe>
        //     </div>
        //     `
        // );
        // setTimeout(() => {
        //   const iframe = document.querySelector('#downlaod_iframe');
        //   const url = `${API_URL}/task/download/${item.id}`;
        //   const headers = [['Authorization', 'Bearer ' +  getToken()]];
        //   loadIframe(iframe, url, headers);
        // }, 800);

        const item = state.dataSelected;
        const url = `${API_URL}/task/download/${item.id}`;
        webix.ajax().get(url, function (res) {
          const data = JSON.parse(res);
          forceDownload(`${data.name}.sql`, data.bundle);
        });
      },
    },
  ],
};

function forceDownload(filename, text) {
  var element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  );
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

function loadIframe(iframe, url, headers) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url);
  xhr.onreadystatechange = handler;
  xhr.responseType = "blob";
  headers.forEach(function (header) {
    xhr.setRequestHeader(header[0], header[1]);
  });
  xhr.send();

  function handler() {
    if (this.readyState === this.DONE) {
      if (this.status === 200) {
        iframe.src = URL.createObjectURL(this.response);
      } else {
        console.error("Request failed", this);
      }
    }
  }
}

const taskList = {
  width: 400,
  view: "datatable",
  id: prefix + "_table",
  select: "row",
  columns: [
    { id: "task_name", header: "Task", fillspace: true, sort: "string" },
  ],
  url: `${API_URL}/task`,
  on: {
    onItemClick: function (sel) {
      const item = this.getItem(sel);
      state.dataSelected = item;
      state.isEdit = true;
      reloadTaskItem($$(prefix + "_item_table"), item.id);

      $$(prefix + "_delete_btn").show();
      $$(prefix + "_edit_btn").show();
      $$(prefix + "_download_btn").show();
      $$(prefix + "_run_btn").show();
    },
    onItemDblClick: function () {
      openForm(this.$scope, true);
    },
  },
};

const taskItem = {
  view: "datatable",
  id: prefix + "_item_table",
  select: "row",
  columns: [
    { id: "schema", header: ["Schema", { content: "textFilter" }] },
    {
      id: "name",
      header: ["Name", { content: "textFilter" }],
      fillspace: true,
    },
    { id: "type", header: "Type", adjust: true },
  ],
};

function closeDownloadFrame() {
  setTimeout(() => $$(prefix + "_page_panel").hideOverlay(), 1000);
}

export function runTarget() {
  const item = state.dataSelected;
  const msgName = item.task_name;
  webix.confirm({
    ok: "Yes",
    cancel: "No",
    text:
      "Are you sure run transfer to target server: <strong>" +
      msgName +
      "</strong> ?",
    callback: function (result) {
      if (result) {
        const panelId = $$(prefix + "_page_panel");
        const btnId = $$(prefix + "_run_btn");
        webix.extend(panelId, webix.ProgressBar);
        panelId.showProgress();
        btnId.disable();
        webix.ajax().post(url + "/transfer/" + item.id, null, function (res) {
          webix.message(`<strong>${msgName} </strong> transfered.`);
          setTimeout(() => {
            panelId.hideProgress();
            btnId.enable();
          }, 1000);
        });
      }
    },
  });
}
function remove() {
  const dt = $$(prefix + "_table");
  const sel = dt.getSelectedId();
  const item = dt.getItem(sel),
    msgName = `${item.task_name}`;

  webix.confirm({
    ok: "Yes",
    cancel: "No",
    text: "Are you sure to delete: <strong>" + msgName + "</strong> ?",
    callback: function (result) {
      if (result) {
        webix.ajax().del(url + "/" + item.id, null, function (res) {
          webix.message(`<strong>${msgName} </strong> deleted.`);
          reloadTask();
          defaultBtn();
        });
      }
    },
  });
}

function openForm(_scope, isEdit) {
  state.isEdit = isEdit;
  // _scope.show("/p/task.form");
  _scope.show("task.form?m=add", { target: "z_task_page" });
}

function defaultBtn() {
  $$(prefix + "_delete_btn").hide();
  $$(prefix + "_edit_btn").hide();
  $$(prefix + "_download_btn").hide();
  $$(prefix + "_run_btn").hide();
}

function reloadTask() {
  $$(prefix + "_table").clearAll();
  $$(prefix + "_table").load(`${API_URL}/task`);
  defaultBtn();
}

export default class TaskPage extends JetView {
  config() {
    return {
      id: prefix + "_page_panel",
      css: "z_overlay_loading",
      rows: [
        taskToolbar,
        {
          cols: [
            taskList,
            { view: "resizer", css: "z_resizer_small" },
            taskItem,
          ],
        },
      ],
    };
  }
}
