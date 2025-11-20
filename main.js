import { app, BrowserWindow, ipcMain, Menu, nativeImage, Tray } from "electron";
import http from "http";
import path from "path";
import ffmpeg from "./src/ffmpeg.js";
import "./src/bridge.js";

const appIcon = "assets/icons/icon.png";
const emptyIcon = nativeImage.createEmpty();
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
            preload: path.join(app.getAppPath(), "src/preload.js")
        }
    });

    // and load the main.html of the app.
    mainWindow.loadFile("main.html");

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

    createServer();
}

/** Create video transcode server */
function createServer() {
    const server = http.createServer((request, response) => {
        const url = new URL(request.url, `http://${request.headers.host}`);
        const params = Object.fromEntries(url.searchParams);
        const ffProc = ffmpeg.fastCodec(params.source, params.fileSize, params.startTime);
        ffProc.stdout.pipe(response);

        request.on('close', () => {
            ffProc.stdout.destroy();
            ffProc.stderr.destroy();
            ffProc.kill();
        });
    }).listen(4725);

    server.on('error', e => {
        toast(e.message);
    });
}

/** Create system tray */
ipcMain.handle("create-tray", () => {
    tray = new Tray(appIcon);
    tray.setToolTip("Recording...");
    tray.count = 0;
    tray.timer = setInterval(() => {
        tray.count++;
        if (tray.count % 2 === 0) {
            tray.setImage(appIcon);
        } else {
            tray.setImage(emptyIcon);
        }
    }, 500);

    mainWindow.hide();
    tray.on("click", () => {
        mainWindow.show();
    });
});

/** Remove system tray */
ipcMain.handle("remove-tray", () => {
    clearInterval(tray.timer);
    tray.destroy();
});