import { jsonrepair } from "jsonrepair";

export function loadExComponentJsonEditor() {
  webix.protoUI(
    {
      name: "json-editor",
      defaults: {},
      $init: function (config) {
        this.$view.innerHTML = "<div style='width:100%;height:100%'></div>";
        this._waitEditor = webix.promise.defer();
        this.$ready.push(this._render_editor);
      },
      $setSize: function (w, h) {
        if (webix.ui.view.prototype.$setSize.call(this, w, h)) {
          if (this._editor) {
            this._editor.resize();
          }
        }
      },
      _render_editor: function () {
        if (this.config.cdn === false) {
          this._render_when_ready();
          return;
        }

        this._cdn =
          this.config.cdn ||
          // "https://cdnjs.cloudflare.com/ajax/libs/jsoneditor/10.0.3";
          "https://cdnjs.cloudflare.com/ajax/libs/jsoneditor/10.4.3";

        webix
          .require([this._cdn + "/jsoneditor.js"])
          .then(webix.bind(this._render_when_ready, this))
          .catch(function (e) {
            console.log(e);
          });
      },
      _render_when_ready: function () {
        webix.require(
          [this._cdn + "/jsoneditor.css"],
          webix.bind(function () {
            if (!document.getElementById("jsoneditor-theme-override")) {
              const style = document.createElement("style");
              style.id = "jsoneditor-theme-override";
              style.innerHTML = `
                .jsoneditor { border-color: #E5B290 !important; }
                .jsoneditor-menu { background-color: #E5B290 !important; border-bottom-color: #E5B290 !important; }
                .jsoneditor-navigation-bar { background-color: #E5B290 !important; border-bottom-color: #E5B290 !important; }
                .jsoneditor > .jsoneditor-menu { border-bottom-color: #E5B290 !important; }
                .jsoneditor-statusbar { border-top-color: #E5B290 !important; }
                .jsoneditor-poweredBy { display: none !important; }
              `;
              document.head.appendChild(style);
            }
            var config = webix.copy(this.config);
            // console.log("config", config);

            const options = {
              mode: "code",
              modes: ["code", "form", "text", "tree", "view", "preview"], // allowed modes
              onModeChange: function (newMode, oldMode) {
                console.log("Mode switched from", oldMode, "to", newMode);
              },
            };

            this._editor = new JSONEditor(this.$view.firstChild, options);
            this._editor.set()
            this._waitEditor.resolve(this._editor);
          }, this)
        );
      },
      setValue: function (value) {
        if (!value && value !== 0) value = "";
        this.config.value = value;
        if (this._editor) {
          this._editor.set(value);
        }
      },
      getValue: function () {
        return this._editor ? this._editor.get() : this.config.value;
      },
      focus: function () {
        this._focus_await = true;
        if (this._editor) this._editor.focus();
      },
      getEditor: function (waitEditor) {
        return waitEditor ? this._waitEditor : this._editor;
      },
      autorepair: function () {
        var value = this._editor.get();
        try {
          JSON.parse(value);
        } catch (e) {
          value = jsonrepair(value);
          this.setValue(value);
        }
      },

      format() {
        // return JSON.stringify(JSON.parse(text), null, indentation);
        this._editor.format();
      },
      compact() {
        // return JSON.stringify(JSON.parse(this._editor.get()),null, 0);
        this._editor.compact();
      },
    },
    webix.ui.view
  );
}


// npm install jsonrepair --legacy-peer-deps --strict-ssl false