import { JetView } from "webix-jet";

export default class SreensaverView extends JetView {
  config() {
    // filter: blur(10px);
    const ui = {
      view: "template",
      id: "idx_screensaver",
      css: "zscreensaver-main",
      template: `
        <div class="intro"">
          <div class="page-inner">
            <p class="sub-title">Simple and Easy PostgresSQL Migration Dev tool</p>
            <h1 class="title text-gradient">ZPG</h1>
           <input type="text" id="ss_password" name="ss_password" placeholder="Password" autofocus>
          </div>
        </div>
              `,
      on: {
        onEnter: function () {
          document.getElementsByClassName("go-btn")[0].click();
        },
      },
    };

    return {
      view: "window",
      fullscreen: true,
      head: false,
      css: "screensaver",
      borderless: true,
      body: ui,
    };
  }

  show(target) {
    this.getRoot().show(target);
  }
  ready() {
  }
}

/*

<style>
  #screensaver {
    display: none
  }

  .has-screensaver #screensaver {
    display: block
  }
</style>

<div id="screensaver">screensaver</div>

<script>
  const INTERACTIVE_EVENTS = [
    'mousedown',
    'mousemove',
    'touchstart',
    'scroll',
    'wheel',
    'keydown',
    // @TODO anything else?
  ];

  const SCREENSAVER_TIMEOUT = 3000


  window.onload = () => {

    let lastEventTime = new Date

    function screenSaver() {
      let elapsed = new Date - lastEventTime
      document.body.classList.toggle(
        'has-screensaver',
        elapsed > SCREENSAVER_TIMEOUT)
      setTimeout(screenSaver, 100)
    }

    INTERACTIVE_EVENTS.forEach(e =>
      window.addEventListener(e,
        () => lastEventTime = new Date()))

    screenSaver()

  }
</script>
https://stackoverflow.com/questions/77605133/in-browser-screensaver-with-javascript
*/