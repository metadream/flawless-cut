import { app, BrowserWindow, dialog, Menu } from "electron";
import path from "path";
import "./ipc.js";

const appPath = app.getAppPath();
const appIcon = path.join(appPath, "assets/build/icon.png");
const preload = path.join(appPath, "src/main/preload.js");
let mainWindow, isQuitting = false;

/** 确保应用始终运行一个实例 */
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) { app.quit() } else {
    // 如果尝试启动第二个实例，则显示第一个
    app.on("second-instance", (_event, _commandLine, _workingDirectory) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

    // Electron初始化完成时创建主窗口，部分API需在此事件后使用
    app.whenReady().then(() => {
        createWindow();
        app.on("activate", function() {
            // 在 MacOS系统规范中，当用户点击Dock图标且当前无其他窗口打开时，通常会重新创建应用窗口
            if (mainWindow === null) createWindow();
        });

        // 应用退出前结束当前Ffmpeg进程
        // app.on('before-quit', () => {
        //     if (global.ffmpegProcess && global.ffmpegProcess.kill) {
        //         try {
        //             global.ffmpegProcess.kill();
        //         } catch (error) {
        //             // Ignored
        //         }
        //     }
        // });
    });

    // 所有窗口关闭后事件
    app.on("window-all-closed", function() {
        // 在MacOS系统规范中，应用程序关闭后通常会保持激活状态，直到通过 Cmd+Q 明确退出。
        if (process.platform !== "darwin") app.quit();
    });
}

/** 创建应用程序主窗口 */
function createWindow() {
    // 隐藏菜单
    Menu.setApplicationMenu(null);

    // 创建浏览器窗口
    mainWindow = global.mainWindow = new BrowserWindow({
        width: 800,   // 设置默认窗口比例是16:9
        height: 580,
        icon: appIcon,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload
        }
    });

    // 加载主页面
    mainWindow.loadFile("index.html");

    // 开发环境下打开调试工具
    if (!app.isPackaged) {
        mainWindow.webContents.openDevTools();
    }

    // 窗口即将关闭事件：当子进程正在运行时弹窗提示
    mainWindow.on('close', (event) => {
        if (!global.ffmpegProcess || isQuitting) return;

        event.preventDefault();
        const choice = dialog.showMessageBoxSync({
            type: 'question',
            defaultId: 1,
            buttons: ['Quit Forcefully', 'Cancel Quit'],
            title: 'Confirm to quit',
            message: 'Process is still in progress. Sure to quit forcefully?'
        });

        if (choice === 0) {
            isQuitting = true;
            app.quit();
        }
    });

    // 窗口已经关闭事件：解除窗口对象的引用
    // 若应用支持多窗口模式，通常会将窗口存储在数组中，此时应删除对应的元素。
    mainWindow.on("closed", function() {
        mainWindow = global.mainWindow = null;
    });
}