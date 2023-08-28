import { state as stateBase } from "../models/Base";
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";
import { FONT_SIZE_EDITOR } from "../config/setting";

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
    let edFontSize = FONT_SIZE_EDITOR;
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

export function showToast(msg, type) {
  let typeMsg = "toasify_success";
  if (typeof type != "undefined") {
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

export function showLoadingText(viewId, text="") {
  webix.html.addCss(viewId.$view, "padding_overlay_zero");
  webix.extend(viewId, webix.OverlayBox);
  viewId.showOverlay(
    `<div class='z_loading_panel'>
        <div class="laoder-spinner-container">
            <div class="loader-spinner"></div>
        </div>
        <div class='z_loading_text'>${text}</div>
    </div>
`
  );
}

export function stripHtml(dirtyString) {
  const doc = new DOMParser().parseFromString(dirtyString, "text/html");
  return (doc.body.textContent || "").replace(/(\r\n|\n|\r|\s\s+)/gm, " ");
}

export function showAlert(msg) {
  webix.alert({
    type: "alert-error",
    title: "ERROR",
    text: msg,
  });
}

export function csvToArray(str, delimiter = ",") {
  // SOURCE: https://sebhastian.com/read-csv-javascript/
  // slice from start of text to the first \n index
  // use split to create an array from string by delimiter
  const headers = str.slice(0, str.indexOf("\n")).split(delimiter);

  // slice from \n index + 1 to the end of the text
  // use split to create an array of each csv value row
  const rows = str.slice(str.indexOf("\n") + 1).split("\n");

  if(rows.slice(-1)[0]==""){
		rows.pop();
	}

  // Map the rows
  // split values from each row into an array
  // use headers.reduce to create an object
  // object properties derived from headers:values
  // the object passed as an element of the array
  const arr = rows.map(function (row) {
    const values = row.split(delimiter);
    const el = headers.reduce(function (object, header, index) {
      // object[header] = values[index];
      object[header] = values[index].replace(/[\r\n]/gm, '');
      return object;
    }, {});
    return el;
  });

  // return the array
  return { col_name: headers, data: arr };
}

export function getCSVDelimeter(text) {
	let index = text.indexOf("\n");
	if (index === -1) index = undefined;
	const firstLineText = text.substring(0, index);
	if (firstLineText.indexOf(",") >= 0) return ",";
	if (firstLineText.indexOf(";") >= 0) return ";";
}


export function csvToArray3(data, fieldSep, newLine) {
  fieldSep = fieldSep || ',';
  newLine = newLine || '\n';
  var nSep = '\x1D';
  var qSep = '\x1E';
  var cSep = '\x1F';
  var nSepRe = new RegExp(nSep, 'g');
  var qSepRe = new RegExp(qSep, 'g');
  var cSepRe = new RegExp(cSep, 'g');
  var fieldRe = new RegExp('(?<=(^|[' + fieldSep + '\\n]))"(|[\\s\\S]+?(?<![^"]"))"(?=($|[' + fieldSep + '\\n]))', 'g');
  var grid = [];
  data.replace(/\r/g, '').replace(/\n+$/, '').replace(fieldRe, function(match, p1, p2) {
      return p2.replace(/\n/g, nSep).replace(/""/g, qSep).replace(/,/g, cSep);
  }).split(/\n/).forEach(function(line) {
      var row = line.split(fieldSep).map(function(cell) {
          return cell.replace(nSepRe, newLine).replace(qSepRe, '"').replace(cSepRe, ',');
      });
      grid.push(row);
  });
  return grid;
  // https://stackoverflow.com/questions/1293147/how-to-parse-csv-data
}

export function csvToArray1(text) {
  return text.match( /\s*(\"[^"]*\"|'[^']*'|[^,]*)\s*(,|$)/g ).map( function (text) {
    let m;
    if (m = text.match(/^\s*,?$/)) return null; // null value
    if (m = text.match(/^\s*\"([^"]*)\"\s*,?$/)) return m[1]; // Double Quoted Text
    if (m = text.match(/^\s*'([^']*)'\s*,?$/)) return m[1]; // Single Quoted Text
    if (m = text.match(/^\s*(true|false)\s*,?$/)) return m[1] === "true"; // Boolean
    if (m = text.match(/^\s*((?:\+|\-)?\d+)\s*,?$/)) return parseInt(m[1]); // Integer Number
    if (m = text.match(/^\s*((?:\+|\-)?\d*\.\d*)\s*,?$/)) return parseFloat(m[1]); // Floating Number
    if (m = text.match(/^\s*(.*?)\s*,?$/)) return m[1]; // Unquoted Text
    return text;
  } );
}



export function JSONToListText(data) {
  if (typeof data == "object") {
    let result = [];
    for (const [key, value] of Object.entries(data)) {
      result.push(
        `${key
          .replace(/_/g, " ")
          .replace(/\b\S/g, (t) => t.toUpperCase())}: ${value}<br>`
      );
    }
    return result.join("");
  }
}

export function colorComboDBSource(viewId) {
  webix.delay(
    function () {
      const _that = viewId;
      const id = _that.getValue();
      const data = _that.getPopup().getList().getItem(id);
      const item =
        _that.$view.getElementsByClassName("webix_el_box")[0].childNodes[0];
      let clr = "#475466",
        bg = "#ffffff";
      if (id && data) {
        if (data.content) {
          bg = data.content;
        }
        if (!isColorLight(bg)) {
          clr = "#ffffff";
        }
        item.style.background = bg;
        item.style.color = clr;
      } else {
        item.style.background = bg;
        item.style.color = clr;
      }
    },
    null,
    null,
    1
  );
}

export function isColorLight(hex, alpha = 1) {
  const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16));
  //return `rgba(${r},${g},${b},${alpha})`;
  const a = 1 - (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return a < 0.5;
  // https://codepen.io/WebSeed/pen/pvgqEq
  // https://stackoverflow.com/questions/21646738/convert-hex-to-rgba
}


export function isInt(value) {
  var x;
  return isNaN(value) ? !1 : ((x = parseFloat(value)), (0 | x) === x);
}