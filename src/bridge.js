import { app, dialog, ipcMain } from "electron";
import ffmpeg from "./ffmpeg.js";

ipcMain.handle('get-app-name', () => app.getName());
ipcMain.handle('get-app-home', () => app.getAppPath());
ipcMain.handle('get-desktop', () => app.getPath("desktop"));

ipcMain.handle("ffmpeg-media-info", ffmpeg.getMediaInfo);
ipcMain.handle("ffmpeg-cut-video", ffmpeg.cutVideo);
ipcMain.handle("ffmpeg-convert-video", ffmpeg.convertVideo);
ipcMain.handle("ffmpeg-record-video", ffmpeg.recordVideo);
ipcMain.handle("ffmpeg-merge-videos", ffmpeg.mergeVideos);
ipcMain.handle("ffmpeg-extract-audio", ffmpeg.extractAudio);
ipcMain.handle("ffmpeg-capture-image", ffmpeg.captureImage);

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