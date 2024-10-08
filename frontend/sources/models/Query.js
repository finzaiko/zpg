import { API_URL, CODE_PREFIX } from "../config/setting";
import { upsertStoreIDB } from "../helpers/idb";
// import { runQuery } from "../views/query/QueryPage";

const path = "query";

export let state = {
  prefix: CODE_PREFIX + path,
  countPage: 0,
  isDataType: 1,
  isSearchDetach: 0,
  isMinimap: 0,
  isDisableHistory: 0,
  isAdjustCols: 0,
  isRestoreLastQuery: 1,
  lastConn: 0
};

export const url = API_URL + "/" + path;

export const snippetStore = new webix.DataCollection();

function changeCommandKeybinding(editor, id, keybinding) {
  editor._standaloneKeybindingService.addDynamicKeybinding("-" + id);
  editor._standaloneKeybindingService.addDynamicKeybinding(id, keybinding);
}

export let initQueryEditor = () => {
  let editorId = $$(state.prefix + "_sql_editor");
  editorId.getEditor(true).then((editor) => {
    // changeCommandKeybinding(
    //   editor,
    //   "editor.action.deleteLines",
    //   monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_E
    //   )

    editor.focus();
    editor.updateOptions({
      // fontSize: "12px",
    }),
      editor.addAction({
        // An unique identifier of the contributed action.
        id: "my-unique-id",

        // A label of the action that will be presented to the user.
        label: "My Label!!!",

        // An optional array of keybindings for the action.
        keybindings: [
          monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
          monaco.KeyCode.F5,
        ],
        precondition: null,

        // A rule to evaluate on top of the precondition in order to dispatch the keybindings.
        keybindingContext: null,

        contextMenuGroupId: "navigation",

        contextMenuOrder: 1.5,

        // Method that will be executed when the action is triggered.
        // @param editor The editor instance is passed in as a convinience
        run: function (ed) {
          // alert("test1 => " + ed.getPosition());
          // runQuery($$(state.prefix + "_source_combo").getValue());
          return null;
        },
      }),
      editor.addAction({
        // An unique identifier of the contributed action.
        id: "my-unique-id2",

        // A label of the action that will be presented to the user.
        label: "My Label2!!!",

        // An optional array of keybindings for the action.
        keybindings: [
          monaco.KeyMod.Shift | monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_F,
        ],
        precondition: null,

        // A rule to evaluate on top of the precondition in order to dispatch the keybindings.
        keybindingContext: null,

        contextMenuGroupId: "navigation",

        contextMenuOrder: 1.5,

        // Method that will be executed when the action is triggered.
        // @param editor The editor instance is passed in as a convinience
        run: function (ed) {
          // alert("test2 => " + ed.getPosition());
          autoFormat();
          return null;
        },
      });
  });
};

export let defaultValue = () => {
  $$(state.prefix + "_source_combo").setValue(1);
};

export let searchHistoryStore = new webix.DataCollection();
// export default new webix.DataCollection();

export function storeLastOpenQuery() {
  const allTabList = $$("tabs").getTabbar().data.options;
  const queryTabList = allTabList.filter((o) => o.id.includes("query"));
  queryTabList.forEach((o) => {
    if (o.id == "query") o.id = "z_query";
    const qEditorId = $$(o.id + "_sql_editor");
    if (qEditorId) {
      const qEditorVal = qEditorId.getValue();
      if (qEditorVal.trim().length > 0) {
        const prefix = o.id;
        const _data = {
          value: qEditorVal,
          modified: new Date().getTime(),
          source_id: parseInt($$(prefix + "_source_combo").getValue()),
        };
        upsertStoreIDB(_data, prefix);
      }
    }
  });
}
