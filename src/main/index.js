import { app, BrowserWindow, ipcMain, Menu, nativeImage, Tray } from "electron";
import path from "path";
import subprocess from "./subprocess.js";
import "./bridge.js";

const appPath = app.getAppPath();
const appIcon = path.join(appPath, "assets/icons/icon.png");
const trayIcon = path.join(appPath, "assets/icons/tray.png");
const recordingIcon = path.join(appPath, "assets/icons/recording.png");
const preload = path.join(appPath, "src/main/preload.js");
let mainWindow, tray;

/** Singleton application instance */
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) { app.quit() } else {
    // Someone tried to run a second instance, we should focus our window.
    app.on("second-instance", (_event, _commandLine, _workingDirectory) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    app.whenReady().then(() => {
        app.on("before-quit", () => subprocess.killAll());
        app.on("will-quit", () => subprocess.killAll());
        process.on("uncaughtException", () => subprocess.killAll());
        process.on("exit", () => subprocess.killAll());
        process.on("SIGINT", () => subprocess.killAll());
        process.on("SIGTERM", () => subprocess.killAll());

        createWindow();
        app.on("activate", function() {
            // On macOS it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (mainWindow === null) createWindow();
        });
    });

    // Quit when all windows are closed.
    app.on("window-all-closed", function() {
        // On macOS it's common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform !== "darwin") app.quit();
    });
}

/** Create main window */
function createWindow() {
    // Hide the menu of application
    Menu.setApplicationMenu(null);

    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,   // Make sure the aspect ratio of video is 16:9
        height: 580,
        icon: appIcon,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload
        }
    });

    // and load the index.html of the app.
    mainWindow.loadFile("index.html");

    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    // Hide window instead of minimize if tray exists
    mainWindow.on("minimize", function() {
        if (tray && !tray.isDestroyed()) {
            mainWindow.hide();
        }
    });

    // Emitted when the window is closed.
    mainWindow.on("closed", function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
}

/** Create system tray */
ipcMain.handle("create-tray", () => {
    const blackIcon = nativeImage.createFromPath(trayIcon).resize({ width: 24, height: 24 });
    const blinkIcon = nativeImage.createFromPath(recordingIcon).resize({ width: 24, height: 24 });
    blackIcon.setTemplateImage(true);

    let count = 0;
    tray = new Tray(blackIcon);
    tray.setToolTip("Screen Recording...");
    tray.timer = setInterval(() => {
        tray.setImage(count++ % 2 === 0 ? blackIcon : blinkIcon);
    }, 500);

    mainWindow.minimize();
    tray.on("click", () => mainWindow.show());
});

/** Remove system tray */
ipcMain.handle("remove-tray", () => {
    clearInterval(tray.timer);
    tray.destroy();
});