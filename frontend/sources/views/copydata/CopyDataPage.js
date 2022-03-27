import { JetView } from "webix-jet";
import { url } from "../../models/ViewData";
import { url as urlProfile } from "../../models/Profile";

export default class CopyDataPage extends JetView {
  config() {
    const toolbar = {
      view: "toolbar",
      css: "z_query_toolbar",
      elements: [
        {
          view: "combo",
          id: "copysourcecombo",
          placeholder: "Source DB",
          width: 200,
          options: {
            url: `${urlProfile}/content?type=2&ls=true`,
            on: {
              onBeforeShow: function () {},
            },
          },
          on: {
            onChange: function (id, val) {},
          },
        },
        {
          view: "combo",
          id: "copytargetcombo",
          width: 200,
          placeholder: "Target DB",
          options: {
            url: `${urlProfile}/content?type=2&ls=true`,
            on: {
              onBeforeShow: function () {},
            },
          },
          on: {
            onChange: function (id, val) {},
          },
        },
        {
          view: "button",
          autowidth: true,
          value: "Apply copy",
          click: function () {
            webix.message({ text: "Not implemented yet", type: "error" });
          },
        },
      ],
    };

    return {
      id: "z_copydata_page",
      rows: [
        toolbar,
        {
          template: "Source: Select data by query",
        },
        {
          template: "Target: Result datatable",
        },
      ],
    };
  }
}
