import { JetView } from "webix-jet";
import { UserForm } from './UserForm';
import { userProfile } from '../../models/UserProfile';
import { url } from '../../models/Setting';
import { ChangePassword } from './ChangePassword';


function changePass(scope) {
  scope.ui(ChangePassword).show();
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
