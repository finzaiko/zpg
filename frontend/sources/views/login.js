import { JetView, plugins } from "webix-jet";
import { LOGIN_ANIMATE } from "../config/setting";
import { state } from "../models/Base";
import { register } from "../models/User";

let enableRegister = true;

export default class AppView extends JetView {
  config() {
    var ui = {
      view: "template",
      css: "ztemplate-main",
      template: !LOGIN_ANIMATE
        ? ""
        : `
      <div class="ocean">
        <div class="wave"></div>
        <div class="wave"></div>
        <div class="wave"></div>
      </div>
      `,
    };

    return ui;
  }
  init() {
    this.ui(WindowView).showWindow();
  }
}

class WindowView extends JetView {
  config() {
    const inputPadding = 7;
    return {
      view: "window",
      position: "center",
      move: true,
      head: this.app.config.name,
      position: "center",
      css: "zwin-transparent",
      body: {
        view: "form",
        scroll: false,
        id: "loginForm",
        width: 300,
        elements: [
          {
            cells: [
              // login
              {
                id: "z_login_segment",
                rows: [
                  {
                    view: "text",
                    label: "Username",
                    name: "username",
                    id: "loginform_username",
                    on: {
                      onEnter: function (ev) {
                        if (this.getValue() != "") {
                          $$("loginform_password").focus();
                        }
                      },
                    },
                  },
                  { height: inputPadding },
                  {
                    view: "text",
                    type: "password",
                    id: "loginform_password",
                    label: "Password",
                    name: "password",
                    attributes: {
                      autocomplete: "new-password",
                    },
                    on: {
                      onEnter: function (ev) {
                        if (this.getValue() != "") {
                          $$("loginform_login").focus();
                        }
                      },
                    },
                  },
                  { height: 10 },
                  {
                    margin: 5,
                    cols: [
                      {
                        view: "button",
                        id: "loginform_login",
                        label: "Login",
                        type: "form",
                        click: () => this.doLogin(),
                      },
                    ],
                  },
                  { height: 10 },
                  {
                    template: "<div class='z_register_link'>Register</div>",
                    height: 32,
                    hidden: true,
                    id: "z_register_btnlink",
                    onClick: {
                      z_register_link: function (ev, id) {
                        $$("z_register_segment").show();
                        setTimeout(
                          () => $$("registerform_username").focus(),
                          1000
                        );
                      },
                    },
                  },
                ],
              },
              // register
              {
                id: "z_register_segment",
                rows: [
                  {
                    view: "text",
                    label: "Username",
                    name: "username_reg",
                    id: "registerform_username",
                    on: {
                      onEnter: function (ev) {
                        if (this.getValue() != "") {
                          $$("registerform_password").focus();
                        }
                      },
                    },
                  },
                  { height: inputPadding },
                  {
                    view: "text",
                    type: "password",
                    id: "registerform_password",
                    label: "Password",
                    name: "password_reg",
                    attributes: {
                      autocomplete: "new-password",
                    },
                    on: {
                      onEnter: function (ev) {
                        if (this.getValue() != "") {
                          $$("registerform_login").focus();
                        }
                      },
                    },
                  },
                  { height: inputPadding },
                  {
                    view: "text",
                    label: "Fullname",
                    name: "fullname",
                    id: "registerform_fullname",
                    on: {
                      onEnter: function (ev) {
                        if (this.getValue() != "") {
                        }
                      },
                    },
                  },
                  { height: inputPadding },
                  {
                    view: "text",
                    label: "Email",
                    name: "email",
                    id: "registerform_email",
                    on: {
                      onEnter: function (ev) {
                        if (this.getValue() != "") {
                        }
                      },
                    },
                  },
                  { height: 10 },
                  {
                    margin: 5,
                    cols: [
                      {
                        view: "button",
                        id: "registerform_login",
                        label: "Register",
                        type: "form",
                        click: () => this.doRegister(),
                      },
                    ],
                  },
                  { height: 10 },
                  {
                    template: "<div class='z_login_link'>Login</div>",
                    height: 32,
                    onClick: {
                      z_login_link: function (ev, id) {
                        $$("z_login_segment").show();
                        setTimeout(
                          () => $$("loginform_username").focus(),
                          1000
                        );
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      on: {
        onShow: function () {
          $$("loginform_username").focus();
          if(state.meta.length>0){
            const isRegister =
              state.meta.find((r) => r.m_key == "allow_register").m_val ===
              "true";
            if (isRegister) {
              $$("z_register_btnlink").show();
            }
          }
          
        },
      },
    };
  }
  showWindow() {
    // this.getRoot().show({ x:100, y:100});
    this.getRoot().show();
  }

  init(view) {
    webix.extend($$("loginForm"), webix.ProgressBar);
  }

  ready() {
    console.log(`state.meta`, state.meta);
    // user test only
    // this.$$("loginform_username").setValue("arifin")
    // this.$$("loginform_password").setValue("arifin123")
  }

  doLogin() {
    const user = this.app.getService("user");
    const form = this.$$("loginForm");

    if (form.validate()) {
      form.disable();
      form.showProgress();
      const data = form.getValues();

      user.login(data.username, data.password).catch(function (err) {
        webix.message({
          type: "error",
          text: "Wrong User or password",
        });
        webix.html.removeCss(form.$view, "invalid_login");
        form.elements.password.focus();
        webix.delay(function () {
          webix.html.addCss(form.$view, "invalid_login");
        });

        form.hideProgress();
        form.enable();
        form.focus();
      });
    }
  }

  doRegister() {
    const form = this.$$("loginForm");
    if (form.validate()) {
      const data = form.getValues();
      
      data.username = data.username_reg;
      data.password = data.password_reg;
      delete data.username_reg;
      delete data.password_reg;
      
      if(data.username=="" && data.password=="" && data.fullname =="" && data.email==""){
        webix.message({
          type: "error",
          text: "All data required",
        });
      }else{
        form.disable();
        form.showProgress();
        register(data)
          .then((r) => {
            console.log(`r`, r);
            form.hideProgress();
            form.enable();
            webix.message({
              text: "Register success, please login",
              type: "success",
            });
            form.clear();
            $$("z_login_segment").show();
            $$("loginform_username").focus();
          })
          .catch(function (err) {
            const errData = JSON.parse(err.response);
            webix.message({ text: errData.message, type: "error" });
            form.hideProgress();
            form.enable();
            form.focus();
          });
      }
    }
  }
}
