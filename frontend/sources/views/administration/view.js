import { JetView } from "webix-jet";
import { url as urlProfile } from "../../models/Profile";
import {
  runAction as runActionSQL,
  runView,
  state,
} from "../../models/Administration";
import { JSONToListText } from "../../helpers/ui";

const prefix = state.prefix;

// function runAction() {
//   const inputData = {
//     source_id: $$(prefix + "_server").getValue(),
//     action: state.action,
//   };

//   runView(inputData).then((r) => {
//     const newView = {
//       view: "datatable",
//       autoConfig: true,
//       data: r.data,
//     };

//     let views = $$(prefix + "_scrollview_body").getChildViews();
//     if (views[0]) {
//       $$(prefix + "_scrollview_body").removeView(views[0]);
//     }

//     $$(prefix + "_result_scrollview").show();
//     $$(prefix + "_scrollview_body").addView(newView);
//   });
// }

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
                    // {
                    //   // view: "combo",
                    //   // id: prefix + "_server",
                    //   // placeholder: "Source server",
                    //   // width: 150,
                    //   // options: {
                    //   //   url: `${urlProfile}/conn?type=1&ls=true`,
                    //   //   fitMaster: false,
                    //   //   width: 200,
                    //   // },
                    //   // on: {
                    //   //   onChange: function (id, val) {
                    //   //     if (id) {
                    //   //       $$(prefix + "_run_btn").enable();
                    //   //     } else {
                    //   //       $$(prefix + "_run_btn").disable();
                    //   //     }
                    //   //   },
                    //   // },
                    // },
                    // {
                    //   view: "button",
                    //   type: "icon",
                    //   css: "zmdi_padding",
                    //   icon: "mdi mdi-play",
                    //   autowidth: true,
                    //   id: prefix + "_run_btn",
                    //   disabled: true,
                    //   click: function () {
                    //     runAction();
                    //   },
                    // },
                    {
                      view:"label",
                      id: prefix + "_titleview_lbl",
                      align: "left"
                      // value:""
                    },
                    {},
                  ],
                },
              ],
            },
          ],
        },
        {
          view: "scrollview",
          id: prefix + "_result_scrollview",
          scroll: false,
          body: {
            id: prefix + "_scrollview_body",
            rows: [],
          },
        },
      ],
    };
  }
  // ready(view, url) {
  //   state.currentView = url[0].page.split(".")[1];
  //   console.log("state.currentView", state.currentView);
  //   // this.$$(prefix + "_result_table").clearAll();
  // }
  urlChange(view, url) {
    state.currentView = url[0].page.split(".")[1];
    console.log("state.currentView", state.currentView);
    let views = $$(prefix + "_scrollview_body").getChildViews();
    if (views[0]) {
      $$(prefix + "_scrollview_body").removeView(views[0]);
    }
    $$(prefix + "_titleview_lbl").setValue(state.dataSelected.title);
  }
}
