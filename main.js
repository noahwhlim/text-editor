const {
  BrowserWindow,
  app,
  ipcMain,
  dialog,
  Notification,
  Menu,
} = require("electron");
const path = require("path");
const fs = require("fs");

const isDevEnv = process.argv.includes("development");

if (isDevEnv) {
  try {
    require("electron-reloader")(module);
  } catch (err) {}
}

let mainWindow;
let globalFilePath;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,

    titleBarStyle: "hiddenInset",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(app.getAppPath(), "renderer.js"),
    },
  });

  if (isDevEnv) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.loadFile("index.html");

  const isMac = process.platform === "darwin";

  const menuTemplate = [
    // { role: 'appMenu' }
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    // { role: 'fileMenu' }
    {
      label: "File",
      submenu: [
        {
          label: "New File",
          accelerator: "CmdOrCtrl+N",
          click: () => {
            ipcMain.emit("create-document-triggered");
          },
        },
        {
          label: "Open File",
          accelerator: "CmdOrCtrl+O",
          click: () => {
            ipcMain.emit("open-document-triggered");
          },
        },
        {
          label: "Save",
          accelerator: "CmdOrCtrl+S",
          click: () => {
            console.log("save menu pressed");
            mainWindow.webContents.send("document-saved");
          },
        },
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },
    // { role: 'editMenu' }
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        ...(isMac
          ? [
              { role: "pasteAndMatchStyle" },
              { role: "delete" },
              { role: "selectAll" },
              { type: "separator" },
              {
                label: "Speech",
                submenu: [{ role: "startSpeaking" }, { role: "stopSpeaking" }],
              },
            ]
          : [{ role: "delete" }, { type: "separator" }, { role: "selectAll" }]),
      ],
    },
    // { role: 'viewMenu' }
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    // { role: 'windowMenu' }
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...(isMac
          ? [
              { type: "separator" },
              { role: "front" },
              { type: "separator" },
              { role: "window" },
            ]
          : [{ role: "close" }]),
      ],
    },
    {
      role: "help",
      submenu: [
        {
          label: "Learn More",
          click: async () => {
            const { shell } = require("electron");
            await shell.openExternal("https://electronjs.org");
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
};

app.whenReady().then(createWindow);

const handleError = () => {
  new Notification({
    title: "An error occurred",
    body: "Sorry, something went wrong.",
  });
};

ipcMain.on("create-document-triggered", () => {
  dialog
    .showSaveDialog(mainWindow, {
      filters: [{ name: "text files", extensions: ["txt"] }],
    })
    .then(({ filePath }) => {
      console.log("filePath: ", filePath);
      globalFilePath = filePath;
      fs.writeFile(filePath, "", (err) => {
        if (err) {
          console.log(err);
        } else {
          mainWindow.webContents.send("document-created", filePath);
        }
      });
    });
});

ipcMain.on("save-document-triggered", (_, content) => {
  if (globalFilePath === undefined) {
    dialog.showErrorBox(
      "Error",
      "You need to create or open a document first."
    );
  } else {
    fs.writeFile(globalFilePath, content, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("File saved");
      }
    });
  }
});

ipcMain.on("open-document-triggered", () => {
  dialog
    .showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "text files", extensions: ["txt"] }],
    })
    .then(({ filePaths }) => {
      const filePath = filePaths[0];

      fs.readFile(filePath, "utf8", (error, content) => {
        if (error) {
          console.log(error);
        } else {
          globalFilePath = filePath;
          mainWindow.webContents.send("document-opened", { filePath, content });
        }
      });
    });
});
