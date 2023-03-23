import { release } from "node:os";
import { join } from "node:path";

import { app, BrowserWindow, globalShortcut, shell } from "electron";
import { type Menubar, menubar } from "menubar";

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, "../");
process.env.DIST = join(process.env.DIST_ELECTRON, "../dist");
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, "../public")
  : process.env.DIST;

// Disable GPU Acceleration for Windows 7
if (release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

const PRODUCTION_URL = "https://app.ygtang.kr";

let mb: Menubar | null = null;

async function createWindow() {
  const win = new BrowserWindow({ icon: join(process.env.PUBLIC, "menuIcon.png") });
  win.hide();

  mb = menubar({
    index: PRODUCTION_URL,
    icon: join(process.env.PUBLIC, "menuIcon.png"),
    browserWindow: {
      title: "영감탱",
      width: 375,
      height: 700,
      resizable: false,
      icon: join(process.env.PUBLIC, "menuIcon.png"),
      webPreferences: {
        // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
        // Consider using contextBridge.exposeInMainWorld
        // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
        nodeIntegration: true,
        contextIsolation: false,
      },
    },
  });

  mb.on("after-create-window", () => {
    mb.window.webContents.setWindowOpenHandler(({ url }) => {
      if (!url.startsWith(PRODUCTION_URL)) shell.openExternal(url);
      return { action: "deny" };
    });
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

app.whenReady().then(() => {
  globalShortcut.register("Control+Space", () => {
    if (mb.window.isVisible()) {
      mb.hideWindow();
    } else {
      mb.showWindow();
    }
  });
});
