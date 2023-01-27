import { state as stateBase } from "../models/Base";
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";

export const pageSize = 10000;
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

export function copyComponent(callback) {
  return {
    cols: [
      {
        view: "button",
        type: "icon",
        icon: "mdi mdi-content-copy",
        tooltip: "Copy to clipboard",
        autowidth: true,
        click: function () {
          callback();

          this.hide();
          const ck = this.getParentView().getChildViews()[1];
          ck.show();
          setTimeout(() => {
            this.show();
            ck.hide();
          }, 1500);
        },
      },
      {
        view: "button",
        autowidth: true,
        hidden: true,
        label:
          '<svg class="animated-check" viewBox="0 0 24 24"><path d="M4.1 12.7L9 17.6 20.3 6.3" fill="none"/></svg>',
      },
    ],
  };
}

export function isUserNameValid(username) {
  /*
  	https://stackoverflow.com/questions/12018245/regular-expression-to-validate-username
    - Only contains alphanumeric characters, underscore and dot.
    - Underscore and dot can't be at the end or start of a username (e.g _username / username_ / .username / username.).
    - Underscore and dot can't be next to each other (e.g user_.name).
    - Underscore or dot can't be used multiple times in a row (e.g user__name / user..name).
    - Number of characters must be between 4 to 20
  */
  const res = /^(?=[a-zA-Z0-9._]{4,20}$)(?!.*[_.]{2})[^_.].*[^_.]$/.exec(
    username
  );
  const valid = !!res;
  return valid;
}

export function isJSONString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

export function showProgressLoading(viewId, iconTopPosition, text) {
  text = text || "";
  iconTopPosition = iconTopPosition || 20;
  webix.extend(viewId, webix.OverlayBox);
  viewId.showOverlay(`<div class="z_overlay_progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" tabindex="0">
				<div class="z_overlay_progress_state" style="top: ${iconTopPosition}%;">
					<div class="z_loading_spinner"></div>
					${text}
				</div>
			</div>`);
}

export function getTextWith(txt, font) {
  //https://stackoverflow.com/questions/31305071/measuring-text-width-height-without-rendering
  const el = document.createElement("canvas");
  const ctx = el.getContext("2d");
  ctx.font = "14px Roboto,sans-serif";
  const text = ctx.measureText(txt);
  return Math.ceil(text.width) + 10;
}

export function showToast(msg,type) {
  let typeMsg = "toasify_success";
  if(typeof type!="undefined"){
    typeMsg = type;
  }
  Toastify({
    text: msg,
    duration: 3000,
    newWindow: true,
    close: false,
    gravity: "bottom", // `top` or `bottom`
    position: "right", // `left`, `center` or `right`
    stopOnFocus: true, // Prevents dismissing of toast on hover
    className: typeMsg,
  }).showToast();
}
