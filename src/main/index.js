import { app, BrowserWindow, dialog, Menu } from "electron";
import path from "path";
import "./ipc.js";

const appPath = app.getAppPath();
const appIcon = path.join(appPath, `assets/build/icon.${process.platform === "win32" ? "ico" : "png"}`);
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

    // Electron初始化完成时创建主窗口
    app.whenReady().then(() => {
        createWindow();

        // 应用退出前结束正在执行的Ffmpeg进程
        app.on("before-quit", () => {
            if (global.ffmpegProcess && global.ffmpegProcess.kill) {
                try { global.ffmpegProcess.kill("SIGKILL"); } catch (e) {}  // Ignored error
            }
        });
    });
}

/** 创建应用程序主窗口 */
function createWindow() {
    // 隐藏菜单
    Menu.setApplicationMenu(null);

    // 创建浏览器窗口
    mainWindow = global.mainWindow = new BrowserWindow({
        width: 800,   // 设置视频显示区域比例是16:9
        height: 612,
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
    mainWindow.on("close", (event) => {
        if (!global.ffmpegProcess || isQuitting) return;

        event.preventDefault();
        const choice = dialog.showMessageBoxSync({
            type: "question",
            title: "Confirm to quit",
            message: "Process is still in progress. Sure to quit forcefully?",
            buttons: ["Force Quit", "Cancel Quit"],
            defaultId: 1
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
        isQuitting = false;
    });
}