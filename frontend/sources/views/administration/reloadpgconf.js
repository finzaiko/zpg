import { JetView } from "webix-jet";
import { url as urlProfile } from "../../models/Profile";
import { runReloadConf, state } from "../../models/Administration";
import { JSONToListText } from "../../helpers/ui";

const prefix = state.prefix;

function reloadConfigAction() {
  console.log("reload config");
  webix.confirm({
    ok: "Yes",
    cancel: "No",
    text: "Are you sure to reload config ?",
    callback: function (result) {
      if (result) {
        const inputData = {
          source_id: $$(prefix + "_server").getValue(),
        };

        runReloadConf(inputData).then((r) => {
          const consoleId = $$(prefix + "_reload_conf_console");
          const emptyId = $$(prefix + "_reload_conf_console_empty");
          consoleId.show();
          emptyId.hide();
          const data = JSONToListText(r);
          consoleId.setHTML(`<pre>${data}</pre>`);
          setTimeout(() => {
            consoleId.setHTML("");
            consoleId.hide();
            emptyId.show();

            let count = 60,
              timer = setInterval(function () {
                const btnId = $$(prefix + "_reload_conf_btn");
                if (btnId) {
                  btnId.setValue(`Reload (${count--})`);
                  btnId.disable();
                  btnId.resize();
                  if (count == 0) {
                    btnId.setValue("Reload");
                    btnId.enable();
                    btnId.resize();
                    clearInterval(timer);
                  }
                } else {
                  clearInterval(timer);
                }
              }, 1000);
          }, 2000);
        });
      }
    },
  });
}

export default class ReloadConfigPanel extends JetView {
  config() {
    return {
      rows: [
        {
          view: "toolbar",
          elements: [
            // {
            //   width: 10,
            // },
            // {
            //   view: "combo",
            //   id: prefix + "_server",
            //   placeholder: "Source server",
            //   width: 150,
            //   options: {
            //     url: `${urlProfile}/conn?type=1&ls=true`,
            //     fitMaster: false,
            //     width: 200,
            //   },
            //   on: {
            //     onChange: function (id, val) {
            //       if (id) {
            //         $$(prefix + "_reload_conf_btn").enable();
            //       } else {
            //         $$(prefix + "_reload_conf_btn").disable();
            //       }
            //     },
            //   },
            // },
            {
              view: "button",
              autowidth: true,
              value: "Reload",
              id: prefix + "_reload_conf_btn",
              css: "webix_primary",
              disabled: true,
              click: function () {
                reloadConfigAction();
              },
            },
            {},
          ],
        },
        {
          view: "template",
          hidden: true,
          id: prefix + "_reload_conf_console",
        },
        {
          id: prefix + "_reload_conf_console_empty",
          template: "Select Database to Reload",
        },
      ],
    };
  }
  urlChange(view, url) {
    //   state.currentView = url[0].page.split(".")[1];
    //   console.log("state.currentView", state.currentView);
    //   let views = $$(prefix + "_scrollview_body").getChildViews();
    //   if (views[0]) {
    //     $$(prefix + "_scrollview_body").removeView(views[0]);
    //   }
    //   $$(prefix + "_titleview_lbl").setValue(state.dataSelected.title);

    const serverSource = $$(prefix + "_server").getValue();
    if (serverSource) {
      $$(prefix + "_reload_conf_btn").enable();
    }
  }
}
