import { JetView } from "webix-jet";
import { state, url } from "../../models/User";
import { showError } from "../../helpers/ui";
import { defaultHeader } from "../../helpers/api";
import { userProfile } from '../../models/UserProfile';

const prefix = state.prefix;
const formId = prefix + "_changepass_form";
function WindowForm() {

  let labelW = 140,
    winId = prefix + "_win",
    winLabel = "Change Password";
  return {
    view: "window",
    modal: true,
    id: winId,
    position: "center",
    head: { height: 38, template: winLabel },
    body: {
      rows: [
        {
          padding: 10,
          view: "form",
          id: formId,
          width: 400,
          type: "clean",
          elements: [
            {
              view: "text",
              type: "password",
              name: "old_password",
              label: "Old Password",
              tooltip: "Old Password",
              id: prefix + "-old_pass",
              labelWidth: labelW
            },
            {
              view: "text",
              type: "password",
              name: "new_password",
              label: "New Password",
              tooltip: "New Password",
              id: prefix + "-new_pass",
              labelWidth: labelW
            },
            {
              view: "text",
              type: "password",
              name: "repeat_password",
              label: "Repeat New Password",
              tooltip: "Repeat New Password",
              id: prefix + "-repeat_pass",
              labelWidth: labelW
            }
          ],
          rules: {
            old_password: webix.rules.isNotEmpty,
            new_password: webix.rules.isNotEmpty,
            repeat_password: webix.rules.isNotEmpty,
          },
          on: {
            onAfterValidation: function(result, value) {
              if (!result) {
                var text = [];
                for (var key in value) {
                  if (key == "old_password") text.push(`Old Password can't be empty`);
                  if (key == "new_password") text.push(`New Password can't be empty`);
                  if (key == "repeat_password") text.push(`Repeat New Password can't be empty`);
                }
                webix.message({ type: "error", text: text.join("<br>")});
              }
            }
          },
        },
        {
          view: "toolbar",
          elements: [
            {},
            {
              view: "button",
              label: "Change Password",
              autowidth: true,
              id: prefix + "-save_btn",
              click: function() {
                if ($$(formId).validate()) {
                  saveChange();
                }
              }
            },
            {
              view: "button",
              value: "Cancel",
              autowidth: true,
              click: function() {
                cancel();
              }
            }
          ]
        }
      ]
    },
    on: {
      onShow: function() {
        $$(prefix + "-old_pass").focus();
      }
    }
  };
}

function saveChange() {
  var data = $$(formId).getValues();
  webix
    .ajax()
    .headers(defaultHeader())
    .put(`${url}/users/${userProfile.userId}/changepass`, data, function(res) {
      webix.message({ type: "success", text: "Password changed" });
      cancel();
    })
    .fail(function(err) {
      webix.message({ type: "error", text: JSON.parse(err.response).message });
      showError(err);
    });
}

function cancel() {
  $$(prefix + "_win").destructor();
}

export class ChangePassword extends JetView {
  config() {
    return WindowForm();
  }
  show(target) {
    this.getRoot().show(target);
  }
}
