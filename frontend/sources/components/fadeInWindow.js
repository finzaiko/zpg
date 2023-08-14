export function loadExComponentFadeInWindow() {
  webix.protoUI(
    {
      name: "fadeInWindow",
      $init: function () {
        this.$ready.push(function () {
          this.attachEvent("onShow", function () {
            const boxes = document.querySelectorAll("body > div.webix_modal");
            boxes.forEach((box) => {
              box.style.backgroundColor = "#FFF";
            });
            this.$view.className =
              this.$view.className + " animate__animated animate__bounceInDown"; // animate__fadeInDown
          });
          this.attachEvent("onHide", function () {
            this.$view.style.display = "block";
            this.$view.className += " animate__fadeOut";
          });
        });
      },
    },
    webix.ui.window
  );
}
