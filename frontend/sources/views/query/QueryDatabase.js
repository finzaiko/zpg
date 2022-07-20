import { JetView } from "webix-jet";
import { state } from "../../models/Query";
import { userProfile } from "../../models/UserProfile";
import { url } from "../../models/Profile";
import { showError } from "../../helpers/ui";
import { testConnection } from "../../models/Database";
import { defaultHeader} from '../../helpers/api';

const prefix = state.prefix + "_server";
let isEdit = false, oldConnName= '';

const WindowForm = () => {
  const winId = prefix + "_win",
    labelW = 70,
    labelWCol2 = 70,
    pageSize = 100;

  const form = {
    padding: 10,
    view: "form",
    id: prefix + "_form",
    width: 500,
    type: "clean",
    hidden: true,
    elements: [
      {
        cols: [
          {
            view: "text",
            label: "Name",
            name: "conn_name",
            id: prefix + "_conn_name",
          },
          {
            view: "text",
            label: "Database",
            name: "database",
            id: prefix + "_database",
          },
        ],
      },
      {
        cols: [
          {
            view: "text",
            label: "Host",
            name: "host",
            id: prefix + "_host",
          },
          {
            cols: [
              {
                view: "text",
                label: "Port",
                name: "port",
                id: prefix + "_port",
                value: "5432",
                type: "number",
                labelWidth: labelWCol2,
              },
              { view: "switch", name: "ssl", value: 0, label:"SSL", labelWidth: 35,width:80},
            ]
          },
        ],
      },
      {
        cols: [
          {
            view: "text",
            label: "Username",
            name: "user",
            id: prefix + "_user",
          },
          {
            view: "text",
            label: "Password",
            name: "password",
            id: prefix + "_password",
            type: "password",
            labelWidth: labelWCol2,
            attributes: { autocomplete: "off" },
            autocomplete: "new-password",
          },
        ],
      },
    ],
    rules: {
      conn_name: webix.rules.isNotEmpty,
      database: webix.rules.isNotEmpty,
      host: webix.rules.isNotEmpty,
      port: webix.rules.isNotEmpty,
      password: webix.rules.isNotEmpty,
    },
    on: {
      onAfterValidation: function (result, value) {
        if (!result) {
          let text = [];
          for (var key in value) {
            if (key == "conn_name") text.push("Name can't be empty");
            if (key == "database") text.push("Database can't be empty");
            if (key == "host") text.push("Host can't be empty");
            if (key == "port") text.push("Port can't be empty");
            if (key == "password") text.push("Password can't be empty");
          }
          webix.message({ type: "error", text: text.join("<br>") });
        }
      },
    },
    elementsConfig: {
      labelPosition: "left",
      labelWidth: labelW,
      bottomPadding: 1,
    },
  };

  const formToolbar = {
    view: "toolbar",
    id: prefix + "_form_tb",
    css: "z-tb",
    width: 500,
    elements: [
      {
        cols: [
          {
            view: "button",
            label: "Add",
            autowidth: true,
            id: prefix + "_add_btn",
            click: function () {
              $$(prefix + "_form").show();
              $$(prefix + "_form").clear();
              $$(prefix + "_save_btn").show();
              $$(prefix + "_form_cancel_btn").show();
              $$(prefix + "_add_btn").hide();
              $$(prefix + "_test_btn").show();
              $$(prefix + "_port").setValue("5432");
              isEdit = false;
              oldConnName = "";
            },
          },
          //   { width: labelW + 10 },
          {
            view: "button",
            value: "Save",
            autowidth: true,
            hidden: true,
            id: prefix + "_save_btn",
            click: function () {
              save();
            },
          },
          {
            view: "button",
            value: "Delete",
            id: prefix + "_delete_btn",
            autowidth: true,
            hidden: true,
            click: function () {
              remove();
            },
          },
          {
            view: "button",
            value: "Duplicate",
            tooltip: "Duplicate selected",
            autowidth: true,
            hidden: true,
            id: prefix + "_duplicate_btn",
            click: function () {
              save(true);
            },
          },
          {
            view: "button",
            value: "Cancel",
            id: prefix + "_form_cancel_btn",
            autowidth: true,
            hidden: true,
            click: function () {
              $$(prefix + "_form").hide();
              $$(prefix + "_add_btn").show();
              $$(prefix + "_form_cancel_btn").hide();
              $$(prefix + "_save_btn").hide();
              $$(prefix + "_save_btn").setValue("Save");
              $$(prefix + "_delete_btn").hide();
              $$(prefix + "_dupicate_btn").hide();
              $$(prefix + "_table").clearSelection();
              isEdit = false;
              oldConnName = "";
            },
          },
          {},
          {
            view: "button",
            label: "Test",
            autowidth: true,
            hidden: true,
            id: prefix + "_test_btn",
            click: function () {
              let data = $$(prefix + "_form").getValues();
              data.type = 2;
              testConnection(false, data);
            },
          },
        ],
      },
    ],
  };

  const grid = {
    view: "datatable",
    id: prefix + "_table",
    resizeColumn: true,
    scrollX: true,
    datafetch: pageSize,
    select: "row",
    height: 300,
    pager: "pagerA",
    columns: [
      {
        id: "conn_name",
        header: "Name",
        width: 150,
      },
      {
        id: "database",
        header: "Database",
        width: 150,
      },
      {
        id: "host",
        header: "Host",
        width: 150,
      },
      {
        id: "port",
        header: "Port",
        width: 100,
      },
      {
        id: "user",
        header: "Username",
        width: 150,
      },
      {
        id: "ssl",
        header: "SSL",
        width: 50,
      },
    ],
    on: {
      onLoadError: function (text, xml, xhr) {
        showError(xhr);
      },
      onBeforeLoad: function () {
        this.showOverlay("Loading...");
      },
      onAfterLoad: function () {
        this.hideOverlay();
      },
      onItemClick: function (sel) {
        $$(prefix + "_form").show();
        $$(prefix + "_form_cancel_btn").show();
        $$(prefix + "_save_btn").show();
        $$(prefix + "_save_btn").setValue("Update");
        $$(prefix + "_test_btn").show();
        $$(prefix + "_delete_btn").show();
        $$(prefix + "_duplicate_btn").show();
        $$(prefix + "_add_btn").hide();
        $$(prefix + "_password").setValue();
        isEdit = true;
        const item = this.getItem(sel);
        console.log('item',item);
        oldConnName = item.conn_name;
        
      },
      onItemDblClick: function () {},
    },
    url: `${url}/conn?type=2`,
  };

  return {
    view: "window",
    modal: true,
    id: winId,
    position: "center",
    move: true,
    head: {
      height: 38,
      template: "DB Connection",
    },
    body: {
      rows: [
        form,
        formToolbar,
        grid,
        {
          view: "toolbar",
          elements: [
            {
              view: "pager",
              id: "pagerA",
              css: "z-pager-aligned-left",
              size: pageSize,
              template: function (data, common) {
                return data.count > 0
                  ? `<span class='z-pager-no'>${data.count}</span>`
                  : "";
              },
            },
            {},
            {
              view: "button",
              value: "Close",
              autowidth: true,
              click: function () {
                close();
              },
            },
          ],
        },
      ],
    },
    on: {
      onShow: function () {
        $$(prefix + "_conn_name").focus();
      },
    },
  };
};

function save(isDuplicate) {
  if ($$(prefix + "_form").validate()) {

    if(typeof isDuplicate=="undefined"){
      isDuplicate=false;
    }
    var data = $$(prefix + "_form").getValues(),
      msgName = data.conn_name;
    data.type = 2;
    data.user_id = userProfile.userId;
    if (!isEdit || isDuplicate) {

      if(isDuplicate){
        if(oldConnName==data.conn_name){
          webix.message({text: "Please Change to different Name", type: "error"});
          return;
        }
        // data.conn_name = data.conn_name + "_copy" + Math.floor(Math.random()*(999-100+1)+100);
      }
      webix
        .ajax()
        .headers(defaultHeader())
        .post(url + "/conn", data, function (res) {
          webix.message({ text: "<strong>" + msgName + "</strong> saved.", type: "success" });
          reload();
        })
        .fail(function (err) {
          showError(err);
        });
    } else {
      webix
        .ajax()
        .headers(defaultHeader())
        .put(url + "/conn/" + data.id, data, function (res) {
          webix.message({
            text: "<strong>" + msgName + "</strong> updated.",type: "success"
          });
          reload();
        })
        .fail(function (err) {
          showError(err);
        });
    }
  }
}

const remove = () => {
  const dt = $$(prefix + "_table");
  const item = dt.getItem(dt.getSelectedId()),
    msgName = item.conn_name;

  webix.confirm({
    ok: "Yes",
    cancel: "No",
    text: "Are you sure to delete: <strong>" + msgName + "</strong> ?",
    callback: function (result) {
      if (result) {
        webix.ajax().del(url + "/conn/" + item.id, null, function (res) {
          webix.message(`<strong>${msgName} </strong> deleted.`);
          reload();
        });
      }
    },
  });
};

const reload = () => {
  $$(prefix + "_table").clearAll();
  $$(prefix + "_table").load(`${url}/conn?type=2`);
  defaultBtn();
};

const close = () => {
  $$(prefix + "_form").clear();
  $$(prefix + "_win").destructor();
};

const defaultBtn = () => {
  $$(prefix + "_form").hide();
  $$(prefix + "_add_btn").show();
  $$(prefix + "_form_cancel_btn").hide();
  $$(prefix + "_save_btn").hide();
  $$(prefix + "_save_btn").setValue("Save");
  $$(prefix + "_delete_btn").hide();
  $$(prefix + "_duplicate_btn").hide();
  $$(prefix + "_test_btn").hide();
  $$(prefix + "_table").clearSelection();
  isEdit = false;
  oldConnName = "";
};

export class QueryDatabase extends JetView {
  config() {
    return WindowForm();
  }
  show(target) {
    this.getRoot().show(target);
  }
  init(view) {}
  ready(view) {
    $$(prefix + "_form").bind($$(prefix + "_table"));
  }
}
