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
ipcMain.handle("ffmpeg-media-info", (event, path) => ffmpeg.getMediaInfo(path));
ipcMain.handle("ffmpeg-cut-video", (event, path, start, end) => ffmpeg.cutVideo(path, start, end));
ipcMain.handle("ffmpeg-convert-video", (event, path, start, end) => ffmpeg.convertVideo(path, start, end));
ipcMain.handle("ffmpeg-record-video", (event, path) => ffmpeg.recordVideo(path));
ipcMain.handle("ffmpeg-merge-videos", (event, paths) => ffmpeg.mergeVideos(paths));
ipcMain.handle("ffmpeg-extract-audio", (event, video, start, end) => ffmpeg.extractAudio(video, start, end));
ipcMain.handle("ffmpeg-capture-image", (event, video) => ffmpeg.captureImage(video));

/** Open native file dialog */
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