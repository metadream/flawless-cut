import { app, dialog, ipcMain } from "electron";
import http from "http";
import ffmpeg from "./ffmpeg.js";

/**
 * Main Process Bridge
 * @since 2025-11-20
 */

/** Get system paths */
ipcMain.handle("get-app-name", () => app.getName());
ipcMain.handle("get-app-path", () => app.getAppPath());
ipcMain.handle("get-desktop", () => app.getPath("desktop"));

/** Ffmpeg methods bridge */
ipcMain.handle("ffmpeg-media-info", ffmpeg.getMediaInfo);
ipcMain.handle("ffmpeg-cut-video", ffmpeg.cutVideo);
ipcMain.handle("ffmpeg-convert-video", ffmpeg.convertVideo);
ipcMain.handle("ffmpeg-record-video", ffmpeg.recordVideo);
ipcMain.handle("ffmpeg-merge-videos", ffmpeg.mergeVideos);
ipcMain.handle("ffmpeg-extract-audio", ffmpeg.extractAudio);
ipcMain.handle("ffmpeg-capture-image", ffmpeg.captureImage);

/** Open native file dialog */
ipcMain.handle("open-file-dialog", (multiple = false) => {
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

/** Create video transcode server */
ipcMain.handle("create-transcode-server", (port = 4725) => {
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