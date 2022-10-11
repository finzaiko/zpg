export const copyToClipboard = (content) => {
  if (window.isSecureContext && navigator.clipboard) {
    securedCopyToClipboard(content);
  } else {
    unsecuredCopyToClipboard(content);
  }
  webix.message({ text: "Copied to clipboard", type: "success" });
};

const unsecuredCopyToClipboard = (text) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand("copy");
  } catch (err) {
    console.error("Unable to copy to clipboard", err);
  }
  document.body.removeChild(textArea);
};

const securedCopyToClipboard = (text) => {
  // https://web.dev/async-clipboard/
  const queryOpts = { name: "clipboard-read", allowWithoutGesture: false };
  const permissionStatus = navigator.permissions.query(queryOpts);
  permissionStatus.then((p) => {
    if (p.state == "denied") {
      navigator.clipboard.readText().then((_) => {});
    }
    // Listen for changes to the permission state
    p.onchange = () => {
      console.log("PermissionState:", p.state);
    };
  });

  try {
    navigator.clipboard.writeText(text);
  } catch (err) {
    console.error("Failed to copy: ", err);
    webix.message({ text: "Failed copy: " + err, type: "error" });
  }
};
