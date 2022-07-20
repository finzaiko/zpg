import { state as stateBase } from "../models/Base";

export const pageSize = 1000;
export const defaultDateFormat = "%d/%m/%Y";
export const mmyyDateFormat = "%M %Y";
export const dbDateFormat = "%Y-%m-%d";

export const getDbDateFormat = webix.Date.dateToStr(dbDateFormat);

// export function defaultHeader() {
//   return { "Content-type": "application/json" };
// }

export const pagerToolbar = (pagerId) => {
  return {
    view: "pager",
    id: pagerId,
    css: "z-pager-aligned",
    size: pageSize,
    template: function (data, common) {
      let start = data.page * data.size,
        end = start + data.size;
      if (end > data.count) end = data.count;

      if (data.size > pageSize) {
        webix.message(`Data show only ${pageSize} records`);
      }

      return (
        "<span class='z-pager-no'>" +
        (start + 1) +
        "-" +
        end +
        " of " +
        data.count +
        "</span> " +
        common.prev() +
        common.next()
      );
    },
  };
};

export const pagerRow = (pagerId) => {
  return {
    view: "pager",
    css: {
      //"background":"yellow",
      //"line-height": "1.6",
      "line-height": "2.5",
      "text-align": "right",
    },
    id: pagerId,
    // css: "z-pager-aligned",
    size: pageSize,
    template: function (data, common) {
      console.log("data.size", data.size);
      if (data.size > pageSize) {
        webix.message(`Data show only ${pageSize} records`);
      }

      return data.count + " rows";
    },
  };
};

export function loadCollection(url) {
  return new webix.DataCollection({
    url: url,
    on: {
      onLoadError: function (err) {
        showError(err);
        return;
      },
    },
  });
}

export function showError(xhr) {
  // console.log("showErrorXHR:", xhr);
  if (SHOW_ERR_DEBUG) {
    let code = "UNKNOWN_ERR";
    let msgText = "Unknown error, check console for details";
    if (xhr.status != 200 || xhr.status != 201 || xhr.status != 202) {
      const data = {
        responseText: xhr.responseText,
        statusText: xhr.statusText,
      };
      const printData = Object.keys(data)
        .map((key) => `${key}: ${data[key]}`)
        .join("<br />");
      code = `HTTP_ERR_${xhr.status}`;
      msgText = printData;
      if (xhr.status == 500) {
        const resText = JSON.parse(xhr.response) || xhr.response;
        code = `DB_ERR_${resText.r_code}`;
        msgText = resText.err_msg;
      } else if (JSON.parse(xhr).r_code !== "") {
        const resText = JSON.parse(xhr);
        code = `DB_ERR_${resText.r_code}`;
        msgText = resText.err_msg;
      }
    }

    msgText =
      msgText.substring(0, 65) +
      "...\n" +
      "<span>" +
      msgText.substring(65, 1000) +
      "</span>";

    webix.alert({
      title: "Server Error",
      type: "alert-error",
      width: "500px",
      text: `<div style='padding:0 10px;'><span style='font-weight: bold;'>Code:</span> ${code} <br><span style='font-weight: bold;'>Message:</span> ${msgText}</div>`,
    });
  }
}

export function showErrorResponse(errResponse) {
  const obj = JSON.parse(errResponse);
  let msg = "";
  Object.keys(obj).forEach(function (key) {
    console.log(key, obj[key]);
    msg += `<b>${key}:</b> ${obj[key]}<br>`;
  });
  webix.message({ text: msg, type: "error" });
}

export function getFlexHeight(defaultHeight = 420) {
  let h =
    window.innerHeight ||
    document.documentElement.clientHeight ||
    document.body.clientHeight;
  if (h <= 1366) {
    return h - 150;
  }
  return defaultHeight;
}

export function tabGoTo(code, event, viewId) {
  if (code == 9) {
    viewId.focus();
    event.preventDefault();
  }
}

export function number(val, decimal) {
  return webix.Number.format(val, {
    groupDelimiter: ",",
    groupSize: 0,
    decimalDelimiter: ".",
    decimalSize: decimal,
  });
}

export function monthEndDate(obj) {
  obj = webix.Date.monthStart(obj);
  obj = webix.Date.add(obj, 1, "month");
  obj = webix.Date.monthStart(obj);
  obj = webix.Date.add(obj, -1, "minute");
  return obj;
}

export function markMinStock(value, config) {
  if (!value <= 0 && config.current_stock <= value) return "z-cell-danger";
}

export function showExpiredMsg(app, forceLogout) {
  webix
    .alert({
      title: "Session expired",
      text: `Your session has expired, please login again`,
    })
    .then(function () {
      if (forceLogout) {
        app.show("/logout");
        setTimeout(() => window.location.reload(), 600);
      }
    });
}

export function setEditorFontSize(editorId) {
  editorId.getEditor(true).then((editor) => {
      let edFontSize = "12";
      if (stateBase.appProfile && Array.isArray(stateBase.appProfile)) {
        edFontSize = stateBase.appProfile.find(
          (o) => o.m_key == "editor_font_size"
        ).m_val;
      }
      editor.updateOptions({
        fontSize: edFontSize + "px",
      });
    });
}
