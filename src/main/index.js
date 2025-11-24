import { app, BrowserWindow, Menu } from "electron";
import path from "path";
import * as subprocess from "./subprocess.js";
import "./ipc.js";

const appPath = app.getAppPath();
const appIcon = path.join(appPath, "assets/build/icon.png");
const preload = path.join(appPath, "src/main/preload.js");
let mainWindow;

/** Make sure the application instance is singleton */
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
    mainWindow = global.mainWindow = new BrowserWindow({
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

    // Open the DevTools in development env.
    if (!app.isPackaged) {
        mainWindow.webContents.openDevTools();
    }

    // Emitted when the window is closed.
    mainWindow.on("closed", function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = global.mainWindow = null;
    });
}