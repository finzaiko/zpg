import { JetView } from "webix-jet";

export default class TextCompareView extends JetView {
  config() {
    return {
      rows: [
        {
          id: "text_compare_view",
          rows: [
            {
              cols: [
                {
                  rows: [
                    {
                      view: "toolbar",
                      css: "accent_toolbar",
                      elements: [
                        { width: 5 },
                        {
                          view: "label",
                          label: "ORIGINAL",
                          css: "z_label_white",
                        },
                        {
                          view: "icon",
                          icon: "mdi mdi-restore",
                          css: "z_toolbar_icon_white",
                          tooltip: "Restore last text",
                          id: "restore_original_text_btn",
                          hidden: true,
                          width: 30,
                          click: function () {
                            const editor = $$("original_text_editor");
                            editor.getEditor(true).then((ed) => {
                              const lastOriginalText =
                                webix.storage.local.get("TXTDIFF_ORIG");
                              const lastModifiedText =
                                webix.storage.local.get("TXTDIFF_MODIF");
                                if(lastOriginalText == null && lastModifiedText == null){
                                  webix.message({
                                    text: "No previous text found to restore.",
                                    type: "error",
                                  });
                                  return;
                                }
                              ed.setValue(lastOriginalText || "");
                              $$("original_text_info").setValue(
                                `Lines: ${ed.getModel().getLineCount()}, Chars: ${ed.getModel().getValue().length}`,
                              );
                              const modifiedEditor = $$("modified_text_editor");
                              modifiedEditor.getEditor(true).then((modEd) => {
                                modEd.setValue(lastModifiedText || "");
                                $$("modified_text_info").setValue(
                                  `Lines: ${modEd.getModel().getLineCount()}, Chars: ${modEd.getModel().getValue().length}`,
                                );
                              });
                            });
                          },
                        },
                        {
                          view: "icon",
                          icon: "mdi mdi-close",
                          css: "z_toolbar_icon_white",
                          tooltip: "Clear Original Text",
                          width: 30,
                          click: function () {
                            $$("original_text_editor").setValue("");
                            $$("original_text_info").setValue(
                              "Lines: 0, Chars: 0",
                            );
                            webix.storage.local.remove("TXTDIFF_ORIG");
                          },
                        },
                      ],
                    },
                    {
                      view: "monaco-editor",
                      id: "original_text_editor",
                      placeholder: "Paste or type original text here",
                      quickSuggestions: false,
                      on: {
                        onChange: function (newVal) {
                          const editor = $$("original_text_editor");
                          const counts = editor.getLineAndCharCount();
                          $$("original_text_info").setValue(
                            `Lines: ${counts.lines}, Chars: ${counts.chars}`,
                          );
                        },
                      },
                    },
                  ],
                },
                { view: "resizer", css: "z_resizer_accent" },
                {
                  rows: [
                    {
                      view: "toolbar",
                      css: "accent_toolbar",
                      elements: [
                        { width: 5 },
                        {
                          view: "label",
                          label: "MODIFIED",
                          css: "z_label_white",
                        },
                        {
                          view: "icon",
                          icon: "mdi mdi-close",
                          css: "z_toolbar_icon_white",
                          tooltip: "Clear Modified Text",
                          width: 30,
                          click: function () {
                            $$("modified_text_editor").setValue("");
                            $$("modified_text_info").setValue(
                              "Lines: 0, Chars: 0",
                            );
                            webix.storage.local.remove("TXTDIFF_MODIF");
                          },
                        },
                      ],
                    },
                    {
                      view: "monaco-editor",
                      id: "modified_text_editor",
                      placeholder: "Paste or type modified text here",
                      quickSuggestions: false,
                      on: {
                        onChange: function (newVal) {
                          const editor = $$("modified_text_editor");
                          const counts = editor.getLineAndCharCount();
                          $$("modified_text_info").setValue(
                            `Lines: ${counts.lines}, Chars: ${counts.chars}`,
                          );
                        },
                      },
                    },
                  ],
                },
              ],
            },
            {
              cols: [
                { width: 5 },
                {
                  view: "label",
                  label: "Lines: 0, Chars: 0",
                  align: "left",
                  css: "z_label_normal_grey",
                  id: "original_text_info",
                },
                {
                  view: "button",
                  label: "Compare",
                  width: 100,
                  align: "center",
                  css: "btn_accent",
                  click: function () {
                    const originalText = $$("original_text_editor").getValue();
                    const modifiedText = $$("modified_text_editor").getValue();
                    if (
                      originalText.trim() == "" ||
                      modifiedText.trim() == ""
                    ) {
                      webix.message({
                        text: "Please fill both original and modified text fields before comparing.",
                        type: "error",
                      });
                      return;
                    }
                    webix.storage.local.put("TXTDIFF_ORIG", originalText);
                    webix.storage.local.put("TXTDIFF_MODIF", modifiedText);
                    $$("compare_result_view").show();
                    $$("text_compare_view").hide();
                    $$("compare_result_editor").setDiffValue(
                      originalText,
                      modifiedText,
                    );
                  },
                },
                {
                  view: "label",
                  label: "Lines: 0, Chars: 0",
                  align: "right",
                  css: "z_label_normal_grey",
                  id: "modified_text_info",
                },
                { width: 5 },
              ],
            },
          ],
        },
        // RESULT VIEW
        {
          hidden: true,
          id: "compare_result_view",
          rows: [
            {
              view: "toolbar",
              css: "accent_toolbar",
              elements: [
                { width: 5 },
                { view: "label", label: "RESULT", css: "z_label_white" },
                {},
                {
                  view: "segmented",
                  value: "sidebyside",
                  css: "z_segmented_accent",
                  inputWidth: 200,
                  width: 205,
                  options: [
                    { id: "sidebyside", value: "Side-by-side" },
                    { id: "inline", value: "Inline" },
                  ],
                  on: {
                    onChange: function (newVal) {
                      const editor = $$("compare_result_editor");
                      if (editor && editor._editor) {
                        // Update the renderSideBySide option on the fly
                        const renderSideBySide = newVal === "sidebyside";
                        editor._editor.updateOptions({
                          renderSideBySide: renderSideBySide,
                        });
                      }
                    },
                  },
                },
                {
                  view: "button",
                  label: "Back",
                  width: 60,
                  align: "center",
                  css: "btn_accent",
                  click: function () {
                    $$("compare_result_view").hide();
                    $$("text_compare_view").show();
                  },
                },
                { width: 5 },
              ],
            },
            {
              view: "monaco-editor",
              id: "compare_result_editor",
              placeholder: "Result will be shown here",
              quickSuggestions: false,
              diffEditor: true,
              automaticLayout: true,
              language: "sql",
              grow: 1,
            },
          ],
        },
      ],
    };
  }

  ready() {
    document.title = "ZPG - Text Diff";
  }

  urlChange(_view, _url) {
      const lastOriginalText = webix.storage.local.get("TXTDIFF_ORIG");
      const lastModifiedText = webix.storage.local.get("TXTDIFF_MODIF");
      if(lastOriginalText == null && lastModifiedText == null){
        $$("restore_original_text_btn").hide();
      }else{
        $$("restore_original_text_btn").show();
      }
  }
}
