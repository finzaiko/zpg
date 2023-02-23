import { state } from "../../models/CopyData";

const prefix = state + "_page";

export default {
  id: prefix + "console_panel",
  hidden: true,
  rows: [
    {
      cols: [
        {
          view: "tabbar",
          css: "copy_tabbar_bottom",
          id: prefix + "tabbar_bottom",
          options: [
            {
              value: "Console",
              id: prefix + "console_tab",
            },
          ],
          height: 26,
          tabOffset: 0,
          optionWidth: 100,
        },
        {
          view: "icon",
          icon: "mdi mdi-close",
          tooltip: "Close",
          click: function () {
            $$(prefix + "console_panel").hide();
            $$(prefix + "console_resizer").hide();
          },
        },
        { width: 4 },
      ],
    },
    {
      cells: [
        {
          id: prefix + "console_tab",
          rows: [{ view: "template", id: prefix + "console_result" }],
        },
      ],
    },
  ],
};
