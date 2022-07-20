import { JetView, plugins } from "webix-jet";
import { menuData } from "../models/Base";
import { routeName } from "./routes";


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
        // {
        // 	template: "<span class='action_setting'>Setting</span> | <span class='action_logout'>Logout</span>",
        // 	height: 35,
        // 	onClick: {
        // 		"action_logout": function(e, id) {
        // 			webix.message("onClick on "+id)
        // 		}
        // 	}
        // }
      ],
    };
    var ui = {
      // id: "p_base",
      type: "clean",
      // paddingX: 5,
      css: "app_layout",
      cols: [
        {
          rows: [
            {
              view: "toolbar",
              // padding: 3,
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
                // {
                //   borderless: true,
                //   template: `<h1></h1>`
                // }
                header
              ]
            },
            // {
            //   view: "button",
            //   type: "icon",
            //   icon: "mdi mdi-menu",
            //   width: 37,
            //   align: "left",
            //   css: "app_button",
            //   click: function() {
            //     $$("app:sidebar").toggle();
            //   }
            // },
            {
              view: "sidebar",
              id: "app:sidebar",
              data: menuData,
              width: 180,
              on:{
                onAfterSelect: function(id){
                  // webix.message("Selected: "+this.getItem(id).value)
                }
              }
            },
          ]
        },
        // { type: "wide", paddingY: 10, paddingX: 5, rows: [{ $subview: true }] },
        // { type: "wide", rows: [{ $subview: true }] },
        {
          css: "z_layout_p", 
          // type: "wide", 
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
    // this.use(plugins.Menu, "top:menu");
    this.use(plugins.Menu, "app:sidebar");

    webix.UIManager.addHotKey(
      "Ctrl+2",
      function () {
        console.log("Ctrl+Enter for details");
        return false;
      },
      $$("p_base")
    ); // for "details" list only
  }

  urlChange(view, url) {
    console.log("url", url);
    // this.app.show("/p/start");
    console.log("this.app", this.app);

    this.app.on("app:guard", function (a, b, nav) {
      // first++;
      // if(first==2){
      //   nav.redirect = "/top/data";
      // }
      // console.log('a', a);
      // console.log('b', b);
      // console.log('nav', nav)
      // nav.redirect = "/p/query";
    });
  }
}
