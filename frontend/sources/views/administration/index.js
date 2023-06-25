import { JetView } from "webix-jet";
import { administrationMenuList, state } from "../../models/Administration";

const prefix = state.prefix;

const toolbar = {
  view: "toolbar",
  elements: [
    {
      view: "icon",
      id: prefix + "_refresh_btn",
      tooltip: "Refresh",
      icon: "mdi mdi-sync",
      autowidth: true,
      click: function () {},
    },
  ],
};

export default class AdministrationPage extends JetView {
  config() {
    return {
      id: "z_administration_page",
      rows: [
        {
          cols: [
            {
              rows: [
                toolbar,
                {
                  view: "list",
                  width: 250,
                  template: "#title#",
                  select: true,
                  css: "z_generator_list",
                  tooltip: function (obj) {
                    return "" + obj.detail;
                  },
                  data: administrationMenuList,
                  on: {
                    onItemClick: function (sel) {
                      this.$scope.show(sel, {
                        target: prefix + "_pageview",
                      });
                    },
                  },
                },
              ],
            },
            { $subview: true, name: prefix + "_pageview" },
          ],
        },
      ],
    };
  }
  init() {
    this.show("administration.default", { target: prefix + "_pageview" });
  }
}
