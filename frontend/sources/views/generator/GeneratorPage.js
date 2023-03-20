import { JetView } from "webix-jet";
import { state } from "../../models/Generator";
import GeneratorOutParams from "./GeneratorOutParams";

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

export default class GeneratorPage extends JetView {
  config() {
    return {
      id: "z_generator_page",
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
                  data: [
                    {
                      id: "generator.outparams",
                      title: "Out params",
                      detail: "Generate query to Out parameter",
                    },
                    {
                      id: "generator.insertquery",
                      title: "Insert Query",
                      detail: "Generate from sheet to Insert SQL",
                    },
                    {
                      id: "generator.erdiagram",
                      title: "ER Diagram",
                      detail: "Generate ER Diagram",
                    },
                  ],
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
    this.show("generator.default", { target: prefix + "_pageview" });
  }
}
