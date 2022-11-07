import "./styles/app.css";
import { JetApp, EmptyRouter, HashRouter, plugins } from "webix-jet";
import { APP_NAME, COOKIE_NAME, PING_SERVER, API_URL } from "./config/setting";
import Session from "./models/Session";
import { state } from "./models/Base";
import { state as stateQuery } from "./models/Query";
import { setAppHeader } from "./helpers/api";
import { initSession, userProfile } from "./models/UserProfile";
import { showExpiredMsg } from "./helpers/ui";

// getAppMeta() {
//   webix.ajax(`${API_URL}/meta`).then((ra) => {
//     console.log(`ra`, ra);
//     state.allowRegister = ra;
//   });
// }

webix.protoUI({
  name:"fadeInWindow",
  $init:function(){
    this.$ready.push(function(){
      this.attachEvent("onShow", function(){
        this.$view.className = this.$view.className + " animate__animated animate__bounceInDown";  // animate__fadeInDown
      })
      this.attachEvent("onHide", function(){
        this.$view.style.display = "block";
        this.$view.className += " animate__fadeOut";
      })
    });
  }
}, webix.ui.window);
// https://snippet.webix.com/mw0mlhvz


export default class MyApp extends JetApp {
  constructor(config) {
    const defaults = {
      id: APPNAME,
      version: VERSION,
      router: BUILD_AS_MODULE ? EmptyRouter : HashRouter,
      debug: !PRODUCTION,
      start: "/index",
      name: APP_NAME,
    };

    super({ ...defaults, ...config });

    this.use(plugins.User, {
      model: Session,
      afterLogin: "/v",
      ping: PING_SERVER,
      public: (path) => path.indexOf("/index") > -1,
    });

    webix.ajax(`${API_URL}/meta`).then((ra) => {
      state.meta = ra.json();
    });
  }
}

if (!BUILD_AS_MODULE) {
  // webix.debug({events: true});
  // webix.ready(() => new MyApp().render() );
  webix.ready(() => {
    const app = new MyApp();
    let appUrl;
    app.on("app:guard", function (url, view, nav) {
      state.navUrl = nav;
      appUrl = nav;
      if (url == "/p") nav.redirect = "/p/start";
    });

    let hasReload = false;

    // Prevent reload page when query editor dirty
    window.onbeforeunload = function (e) {
      e = e || window.event;
      let sum = 0;
      for (let i = 0; i < stateQuery.countPage + 1; i++) {
        if (i > 0) {
          if ($$("z_query_" + i + "_sql_editor")) {
            const a = $$("z_query_" + i + "_sql_editor").getValue().length;
            sum += a;
          }
        } else {
          if ($$("z_query_sql_editor")) {
            const b = $$("z_query_sql_editor").getValue().length;
            sum += b;
          }
        }
      }
      if (sum > 0) {
        // // For IE and Firefox prior to version 4
        if (e) {
          e.returnValue = "Sure?";
        }
        // // For Safari
        return "Sure?";
      }
    };

  //   if (window.history && window.history.pushState) {
  //     console.log("asdfasdf");
  //     window.addEventListener("popstate", (event) => {
  //       console.log(
  //         "location: " +
  //           document.location +
  //           ", state: " +
  //           JSON.stringify(event.state)
  //       );
  //       // webix.confirm("Are you sure?").then((result) => {
  //       //   if (result) {
  //       //     history.back();
  //       //   }
  //       // });
  //       // history.go(1);
  //       history.pushState(null, null, window.location.href);
  //     });
  //   }

  //   // window.onbeforeunload = function() { return "You will  leave this page"; };

  //   if (window.history && history.pushState) {
  //     addEventListener('load', function() {
  //        history.pushState(null, null, null); // creates new history entry with same URL
  //        addEventListener('popstate', function() {
  //           var stayOnPage = confirm("Would you like to save this draft?");
  //           if (!stayOnPage) {
  //              history.back()
  //           } else {
  //              history.pushState(null, null, null);
  //           }
  //        });
  //     });
  //  }

    webix.attachEvent(
      "onBeforeAjax",
      function (mode, reqUrl, data, request, headers, files, promise) {
        promise.then((a) => {
          const status = a.json().status;
          const _appUrl = appUrl.url[0].page;
          if (status === null && _appUrl !== "login") {
            webix.storage.cookie.remove(COOKIE_NAME);
            userProfile.token = "";
            if (!hasReload) {
              showExpiredMsg(app, true);
              hasReload = true;
            }
          }
        });
        promise.catch((b) => {
          if (
            b.status == 401 &&
            !/\/auth\/login.*|\/v1$/.test(request.responseURL)
          ) {
            if (!hasReload) {
              showExpiredMsg(app, true);
              hasReload = true;
            }
          }
        });

        if (/\/auth\/login.*|\/v1$/.test(request.responseURL)) {
          webix.storage.cookie.remove(COOKIE_NAME);
          userProfile.token = "";
        }

        // });
        if (!webix.storage.cookie.get(COOKIE_NAME)) {
          // window.location.reload();
        } else {
          setAppHeader(headers);
        }
      }
    );

    // webix.ajax(`${API_URL}/app`).then((ra) => {
    //   const data = ra.json();
    //   console.log(`profile-ra`, data);
    //   // state.meta = ra.json();
    //   state.appProfile = JSON.parse(data.data.find((m)=>m.type==5).content);
    //   console.log(`d`, state.appProfile);
    // });

    initSession();
    app.render();
  });
}
