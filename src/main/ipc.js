import { app, dialog, ipcMain, nativeImage, shell, Tray } from "electron";
import http from "http";
import path from "path";
import * as subprocess from "./subprocess.js";
import * as ffmpeg from "./ffmpeg.js";

/** 初始化系统托盘图标 */
const trayIcon = path.join(app.getAppPath(), "assets/build/tray.png");
const recordingIcon = path.join(app.getAppPath(), "assets/build/recording.png");
const blinkIcon = nativeImage.createFromPath(recordingIcon).resize({ width: 24, height: 24 });
const defaultIcon = nativeImage.createFromPath(trayIcon).resize({ width: 24, height: 24 });
defaultIcon.setTemplateImage(true);

/** 本地全局变量 */
let recordingTray = null;
let recordingProcess = null;
let transcodeServer = null;

/** 注册常用 IPC 方法 */
ipcMain.handle("get-app-name", () => app.getName());
ipcMain.handle("get-app-path", () => app.getAppPath());
ipcMain.handle("get-desktop", () => app.getPath("desktop"));
ipcMain.handle("open-file-dialog", (event, multiple) => openMediaDialog(multiple));
ipcMain.handle("open-external", (event, url) => shell.openExternal(url));
ipcMain.handle("create-tray", () => createTray());
ipcMain.handle("remove-tray", () => removeTray());

/** 注册 FFMPEG IPC 方法 */
ipcMain.handle("create-transcode-server", (event, port) => createTranscodeServer(event, port));
ipcMain.handle("ffmpeg-exit-recording", () => recordingProcess.stdin.write("q"));
ipcMain.handle("ffmpeg-media-info", (event, path) => ffmpeg.getMediaInfo(path));
handleFfmpegIpcMethod("ffmpeg-cut-video", (...args) => ffmpeg.cutVideo(...args));
handleFfmpegIpcMethod("ffmpeg-convert-video", (...args) => ffmpeg.convertVideo(...args));
handleFfmpegIpcMethod("ffmpeg-merge-videos", (...args) => ffmpeg.mergeVideos(...args));
handleFfmpegIpcMethod("ffmpeg-extract-audio", (...args) => ffmpeg.extractAudio(...args));
handleFfmpegIpcMethod("ffmpeg-capture-image", (...args) => ffmpeg.captureImage(...args));
handleFfmpegIpcMethod("ffmpeg-record-screen", (...args) => ffmpeg.recordScreen(...args));

/** 打开原生文件选择对话框并限制媒体格式 */
function openMediaDialog(multiple = false) {
    return dialog.showOpenDialog({
        properties: ["openFile", multiple ? "multiSelections" : false],
        filters: [{
            name: "Media Files", extensions: [
                "3gp", "asf", "avi", "dat", "flv",
                "mkv", "mov", "mp4", "mpg", "mpeg", "ogg", "rm", "rmvb", "vob", "wmv",
                "aac", "ape", "alac", "flac", "mp3", "wav"
            ]
        }, {
            name: "All Files", extensions: ["*"]
        }]
    });
}

/** 创建全局视频转码服务 */
function createTranscodeServer(event, port = 4725) {
    if (transcodeServer) return;

    transcodeServer = http.createServer((request, response) => {
        const url = new URL(request.url, `http://${request.headers.host}`);
        const params = Object.fromEntries(url.searchParams);
        const proc = ffmpeg.fastCodec(params.source, params.fileSize, params.startTime);
        proc.stdout.pipe(response);

        request.on("close", () => {
            proc.stdout.destroy();
            proc.stderr.destroy();
            proc.kill();
        });
    }).listen(port);

    transcodeServer.on("error", e => {
        event.sender.send("transcode-error", e.message);
    });
}

/** 创建系统托盘 (MacOS为菜单栏图标) */
function createTray() {
    let count = 0;
    recordingTray = new Tray(defaultIcon);
    recordingTray.setToolTip("Screen Recording...");

    recordingTray.timer = setInterval(() => {
        tray.setImage(count++ % 2 === 0 ? defaultIcon : blinkIcon);
    }, 500);

    recordingTray.on("click", () => {
        global.mainWindow.show();
    });
}

/** 移除系统托盘 */
function removeTray() {
    clearInterval(recordingTray.timer);
    recordingTray.destroy();
}

/** 注册 FFMPEG 方法并监听进程事件 */
function handleFfmpegIpcMethod(ipcName, ffmpegMethod) {
    ipcMain.handle(ipcName, async (event, ...args) => {
        try {
            const proc = await ffmpegMethod(...args);

            proc.emitter.on("start", () => {
                event.sender.send("process-start");
            });
            proc.emitter.on("finish", () => {
                event.sender.send("process-finish");
            });
            proc.emitter.on("success", () => {
                event.sender.send("process-success");
            });
            proc.emitter.on("progress", p => {
                event.sender.send("process-progress", p);
            });
            proc.emitter.on("error", e => {
                event.sender.send("process-error", e.message);
            });

            if (ipcName === "ffmpeg-record-screen") {
                proc.emitter.on("timeupdate", t => {
                    event.sender.send("recording-update", t);
                });
                proc.on("exit", () => {
                    event.sender.send("recording-exit");
                });
                recordingProcess = proc;
            }

            subprocess.register(proc);
            return proc.pid;
        } catch (e) {
            event.sender.send("process-error", e.message);
        }
    });
}