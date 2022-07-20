import { JetView } from "webix-jet";
import { userProfile } from "../models/UserProfile";

export default class AppView extends JetView {
  config() {
    const ui = {
      view: "template",
      id: "idx_landing",
      css: "ztemplate-main",
      template: `
      <div class="intro">
        <div class="page-inner">
          <p class="sub-title">Simple and Easy PostgresSQL Migration Dev tool</p>
          <h1 class="title text-gradient">ZPG</h1>
          <div class='go-btn' route="/${
            userProfile.userId != 0 ? "v" : "login"
          }">Go to console <span class='right-arrow-btn'>&#8594;</span></div>
        </div>
      </div>
			`,
      on: {
        onEnter: function () {
          document.getElementsByClassName("go-btn")[0].click();
        },
      },
    };

    return ui;
  }
  ready(){
    console.log(`userProfile`, userProfile);
    document.querySelectorAll('.ztemplate-main')[0].click();
  }
}
