const { app, BrowserWindow } = require("electron");
const path = require("path");
const server = require("./backend");

let mainWindow;

function getIcon() {
  return path.resolve(path.join(__dirname, `public/icons/png/512x512.png`))
}

const options = {
  autoHideMenuBar: true,
  width: 1300,
  height: 700,
  webPreferences: {
    nodeIntegration: true,
    nativeWindowOpen: true,
    devTools: false
  },
  icon: getIcon()
};


function createWindow() {
  if (process.platform === "linux" && app.isPackaged) {
  }
  mainWindow = new BrowserWindow(options);

  mainWindow.loadURL("http://localhost:9000");
  mainWindow.on("closed", function () {
    mainWindow = null;
  });
}

app.on("ready", createWindow);

app.on("resize", function (e, x, y) {
  mainWindow.setSize(x, y);
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  if (mainWindow === null) {
    createWindow();
  }
});
