import { JetView } from "webix-jet";
import { UserForm } from './UserForm';
import { userProfile } from '../../models/UserProfile';
import { url } from '../../models/Setting';
import { ChangePassword } from './ChangePassword';
import { VERSION } from "../../config/setting";


function changePass(scope) {
  scope.ui(ChangePassword).show();
}

function about(scope) {
  scope.ui({
      view:"window",
      height:200,
      width:300,
      move:true,
      position:"center",
      close:true,
      head:"About ZPG",
      body:{
        template: `
          <strong>Version: </strong> ${VERSION} <br>
          <strong>Repository: </strong> <a href="https://github.com/finzaiko/zpg" target="_blank">https://github.com/finzaiko/zpg</a><br>
        `
      }
  }).show();
}

export default class SettingPage extends JetView {
  config() {
    const logout = {
      view: "button",
      type: "icon",
      icon: "mdi mdi-power",
      css: "zmdi_padding",
      tooltip: "Logout",
      autowidth: true,
      click: () => {
        this.app
          .getService("user")
          .logout()
          .then((r) => {
            if (r) this.show("/logout");
          });
      },
    };

    const toolbar = {
      view: "toolbar",
      css: "z_query_toolbar",
      elements: [
        {
          view: "button",
          type:"icon",
          autowidth: true,
          css: "zmdi_padding",
          icon: "mdi mdi-check-circle-outline",
          tooltip: "Apply changes",
        },
        {
          view: "button",
          type: "icon",
          css: "zmdi_padding",
          autowidth: true,
          icon: "mdi mdi-backup-restore",
          tooltip: "Reset default",
        },
        {
          view: "button",
          type: "icon",
          css: "zmdi_padding",
          icon: "mdi mdi-account",
          hidden:true,
          autowidth: true,
          id:"z_userlist_btn",
          tooltip: "Users",
          click: function () {
            this.$scope.ui(UserForm).show();
          }
        },
        {},
        {
          view: "label",
          label: `(${userProfile.fullname})`,
          css: {
            "text-align":"right"
          }
        },
        {
          view: "button",
          type: "icon",
          icon: "mdi mdi-information-outline",
          css: "zmdi_padding",
          autowidth: true,
          tooltip: "About ZPG",
          click: function () {
            about(this.$scope);
          }
        },
        {
          view: "button",
          type: "icon",
          icon: "mdi mdi-lock-reset",
          css: "zmdi_padding",
          autowidth: true,
          tooltip: "Change Password",
          click: function () {
            changePass(this.$scope);
          }
        },
        logout
      ],
    };

    const table = {
      view: "datatable",
      select: "row",
      columns: [
        { id: "m_key", header: "Key", width: 200 },
        { id: "m_val", header: "Value", width: 300 },
        { id: "note", header: "Note", fillspace: true },
      ],
      url: `${url}`
      // data: [
      //   {
      //     map_key: "theme",
      //     map_val: "default",
      //     note: "Theme",
      //   },
      //   {
      //     map_key: "editor_font",
      //     map_val: "12px",
      //     note: "Editor Font Size",
      //   },
      //   {
      //     map_key: "query_conn",
      //     map_val: "false",
      //     note: "Query DB Connection last state",
      //   },
      //   {
      //     map_key: "viewdata_conn",
      //     map_val: "false",
      //     note: "View Data DB Connection last state",
      //   },
      //   {
      //     map_key: "viewdata_table",
      //     map_val: "false",
      //     note: "View Data table content"
      //   },
      //   {
      //     map_key: "query_timeout",
      //     map_val: "120 sec",
      //     note: "Query timeout"
      //   },
      //   {
      //     map_key: "view_style",
      //     map_val: "Tabbar",
      //     note: "View style page: tabbar or single page"
      //   },
      //   {
      //     map_key: "allow_register",
      //     map_val: "false",
      //     note: "Enable self register (admin only)",
      //     type: "1" // for admin only
      //   },
      // ],
    };
    return {
      rows: [toolbar, table],
    };
  }
  ready(view){
    if(userProfile.userLevel<2){
      $$("z_userlist_btn").show();
    }
  }
}
