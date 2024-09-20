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
    devTools: true
  },
  icon: getIcon()
};


function createWindow() {
  if (process.platform === "linux" && app.isPackaged) {
  }
  mainWindow = new BrowserWindow(options);

  mainWindow.loadURL("http://localhost:9000");
  mainWindow.on("closed", function () {
    console.log("LOG: app on close");
    mainWindow = null;
    app.quit();
  });

  mainWindow.on('before-quit', function (e) {
    // Handle menu-item or keyboard shortcut quit here
    console.log("LOG: before-quite");
  });

  mainWindow.on('activate-with-no-open-windows', function(){
    console.log("LOG: activate-with-no-open-windows");
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

app.on('will-quit', function () {
  // This is a good place to add tests insuring the app is still
  // responsive and all windows are closed.
  console.log("will-quit");
  console.log("LOG: will-quit");
  // REFERENCES: https://stackoverflow.com/a/32950922

  mainWindow = null;
});
