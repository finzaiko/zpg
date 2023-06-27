import { JetView } from "webix-jet";
import { state } from "../../models/Administration";

const prefix = state.prefix;

export default class ViewPanel extends JetView {
  config() {
    return {
      rows: [
        {
          view: "toolbar",
          elements: [
            { width: 10 },
            {
              view: "label",
              id: prefix + "_titleview_lbl",
              align: "left",
            },
            {},
          ],
        },
        {
          view: "scrollview",
          id: prefix + "_result_scrollview",
          scroll: false,
          body: {
            id: prefix + "_scrollview_body",
            rows: [],
          },
        },
      ],
    };
  }
  urlChange(view, url) {
    state.currentView = url[0].page.split(".")[1];
    let views = $$(prefix + "_scrollview_body").getChildViews();
    if (views[0]) {
      $$(prefix + "_scrollview_body").removeView(views[0]);
    }
    $$(prefix + "_titleview_lbl").setValue(state.dataSelected.title);
  }
}
