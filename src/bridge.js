import { app, dialog, ipcMain } from "electron";
import http from "http";
import ffmpeg from "./ffmpeg.js";

/** Application paths */
ipcMain.handle("get-app-name", () => app.getName());
ipcMain.handle("get-app-path", () => app.getAppPath());
ipcMain.handle("get-desktop", () => app.getPath("desktop"));

/** Ffmpeg methods */
ipcMain.handle("ffmpeg-media-info", (event, path) => ffmpeg.getMediaInfo(path));
handleFfmpegIpcMethod("ffmpeg-cut-video", (...args) => ffmpeg.cutVideo(...args));
handleFfmpegIpcMethod("ffmpeg-convert-video", (...args) => ffmpeg.convertVideo(...args));
handleFfmpegIpcMethod("ffmpeg-record-video", (...args) => ffmpeg.recordVideo(...args));
handleFfmpegIpcMethod("ffmpeg-merge-video", (...args) => ffmpeg.mergeVideos(...args));
handleFfmpegIpcMethod("ffmpeg-extract-video", (...args) => ffmpeg.extractAudio(...args));
handleFfmpegIpcMethod("ffmpeg-capture-video", (...args) => ffmpeg.captureImage(...args));

/** Open native dialog */
ipcMain.handle("open-file-dialog", (event, multiple = false) => {
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
});

// TODO 返回值无法通过IPC传递
/** Create video transcode server */
ipcMain.handle("create-transcode-server", (event, port = 4725) => {
    return http.createServer((request, response) => {
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
});

/** Handle ffmpeg methods and listen events  */
function handleFfmpegIpcMethod(ipcName, ffmpegMethod) {
    ipcMain.handle(ipcName, (event, ...args) => {
        const proc = ffmpegMethod(...args);

        proc.emitter.on("start", () => {
            event.sender.send("process-start");
        });
        proc.emitter.on("finish", () => {
            event.sender.send("process-finish");
        });
        proc.emitter.on("progress", p => {
            event.sender.send("process-progress", p);
        });
        proc.emitter.on("error", e => {
            event.sender.send("process-error", e.message);
        });
        return proc.pid;
    });
}