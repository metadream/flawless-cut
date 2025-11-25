import { app, dialog, ipcMain, nativeImage, shell, Tray } from "electron";
import http from "http";
import path from "path";
import * as ffmpeg from "./ffmpeg.js";

/** 初始化系统托盘图标 */
const defaultIcon = path.join(app.getAppPath(), "assets/build/tray-default.png");
const recordingIcon = path.join(app.getAppPath(), "assets/build/tray-recording.png");
const defaultImage = nativeImage.createFromPath(defaultIcon).resize({ width: 18, height: 18 });
const recordingImage = nativeImage.createFromPath(recordingIcon).resize({ width: 18, height: 18 });

/** 本地全局变量 */
let transcodeServer = null;
let recordingTray = null;

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
ipcMain.handle("ffmpeg-exit-recording", () => global.ffmpegProcess.stdin.write("q"));
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
    recordingTray = new Tray(defaultImage);
    recordingTray.setToolTip("Screen Recording...");

    recordingTray.timer = setInterval(() => {
        recordingTray.setImage(count++ % 2 === 0 ? defaultImage : recordingImage);
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
    ipcMain.handle(ipcName, (event, ...args) => {
        if (global.ffmpegProcess) {
            event.sender.send("ipc-error", "Wait for the previous operation to complete.");
            return;
        }

        try {
            const proc = ffmpegMethod(...args);
            global.ffmpegProcess = proc;

            proc.emitter.on("start", () => {
                event.sender.send("process-start");
            });
            proc.emitter.on("progress", p => {
                event.sender.send("process-progress", p);
            });
            proc.emitter.on("complete", () => {
                event.sender.send("process-complete");
                global.ffmpegProcess = null;
            });
            proc.emitter.on("error", e => {
                event.sender.send("process-error", e.message);
            });

            if (ipcName === "ffmpeg-record-screen") {
                proc.emitter.on("start", () => {
                    createTray();
                });
                proc.emitter.on("timeupdate", t => {
                    if (!event.sender.isDestroyed()) {  // 防止应用强制退出后IPC仍旧发送数据导致报错
                        event.sender.send("recording-update", t);
                    }
                });
                proc.on("exit", () => {
                    removeTray();
                    if (!event.sender.isDestroyed()) {  // 防止应用强制退出后IPC仍旧发送数据导致报错
                        event.sender.send("recording-exit");
                    }
                });
            }
        } catch (e) {
            event.sender.send("ipc-error", e.message);
        }
    });
}