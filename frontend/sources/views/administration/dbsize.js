import { JetView } from "webix-jet";
import { url as urlProfile } from "../../models/Profile";
import { runAction as runActionSQL, state } from "../../models/Administration";
import { JSONToListText } from "../../helpers/ui";

const prefix = state.prefix;

function runAction() {
  const inputData = {
    source_id: $$(prefix + "_server").getValue(),
    action: "dbsize",
  };

  runActionSQL(inputData).then((r) => {
    console.log("r", r);
    const resultId = $$(prefix + "_result_table");
    const emptyId = $$(prefix + "_result_table_empty");
    emptyId.hide();
    resultId.show();
    resultId.parse(r.data);
  });
}

export default class DBSizePanel extends JetView {
  config() {
    return {
      rows: [
        {
          view: "toolbar",
          elements: [
            {
              rows: [
                {
                  cols: [
                    { width: 10 },
                    {
                      view: "combo",
                      id: prefix + "_server",
                      placeholder: "Source server",
                      width: 150,
                      options: {
                        url: `${urlProfile}/conn?type=1&ls=true`,
                        fitMaster: false,
                        width: 200,
                      },
                      on: {
                        onChange: function (id, val) {
                          if (id) {
                            $$(prefix + "_run_btn").enable();
                          } else {
                            $$(prefix + "_run_btn").disable();
                          }
                        },
                      },
                    },
                    {
                      view: "button",
                      type: "icon",
                      css: "zmdi_padding",
                      icon: "mdi mdi-play",
                      autowidth: true,
                      id: prefix + "_run_btn",
                      disabled: true,
                      click: function () {
                        runAction();
                      },
                    },
                    {},
                  ],
                },
              ],
            },
          ],
        },
        {
          view: "datatable",
          hidden: true,
          autoConfig: true,
          id: prefix + "_result_table",
        },
        {
          id: prefix + "_result_table_empty",
        },
      ],
    };
  }
}
