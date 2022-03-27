import { JetView, plugins } from "webix-jet";
import { menuData } from "../models/Base";


export default class TopView extends JetView {
  config() {
    const header = {
      type: "header",
      borderless: true,
      template: `<a route="/index">${this.app.config.name}</a>`,
      css: "webix_header app_header",
    };

    const menuBottom = {
      css: "z_setting_btn",
      cols: [
        { view: "button", value: "Setting", css: "z_btn_transparent" },
        { view: "button", value: "Logout", css: "z_btn_transparent" },
      ],
    };
    var ui = {
      type: "clean",
      css: "app_layout",
      cols: [
        {
          rows: [
            {
              view: "toolbar",
              css: "zheader",
              height: 34,
              elements: [
                {
                  view: "button",
                  type: "icon",
                  icon: "mdi mdi-menu",
                  width: 37,
                  align: "left",
                  css: "app_button",
                  click: function() {
                    $$("app:sidebar").toggle();
                  }
                },
                header
              ]
            },
            {
              view: "sidebar",
              id: "app:sidebar",
              data: menuData,
              width: 180,
            },
          ]
        },
        {
          css: "z_layout_p", 
          padding:{
            left:4
          },
          rows: [{ $subview: true }] 
        },
      ],
    };

    return ui;
  }

  init() {
    this.use(plugins.Menu, "app:sidebar");

    webix.UIManager.addHotKey(
      "Ctrl+2",
      function () {
        return false;
      },
      $$("p_base")
    ); // for "details" list only
  }

  urlChange(view, url) {
    this.app.on("app:guard", function (a, b, nav) {
    });
  }
}
