const { contextBridge, ipcRenderer, webUtils } = require("electron");

/** 对渲染进程暴露 electron 相关接口 */
contextBridge.exposeInMainWorld("electron", {
    getAppName: () => ipcRenderer.invoke("get-app-name"),
    getAppPath: () => ipcRenderer.invoke("get-app-path"),
    getDesktop: () => ipcRenderer.invoke("get-desktop"),

    openExternal: url => ipcRenderer.invoke("open-external", url),
    openFileDialog: multiple => ipcRenderer.invoke("open-file-dialog", multiple),
    encodeFileName: path => ipcRenderer.invoke("encodeFileName", path),
    getFilePath: file => webUtils.getPathForFile(file)
});

/** 对渲染进程暴露 ffmpeg 相关接口 */
contextBridge.exposeInMainWorld("ffmpeg", {
    getMediaInfo: (...args) => ipcRenderer.invoke("ffmpeg-media-info", ...args),
    cutVideo: (...args) => ipcRenderer.invoke("ffmpeg-cut-video", ...args),
    convertVideo: (...args) => ipcRenderer.invoke("ffmpeg-convert-video", ...args),
    mergeVideos: (...args) => ipcRenderer.invoke("ffmpeg-merge-videos", ...args),
    extractAudio: (...args) => ipcRenderer.invoke("ffmpeg-extract-audio", ...args),
    captureImage: (...args) => ipcRenderer.invoke("ffmpeg-capture-image", ...args),
    recordScreen: (...args) => ipcRenderer.invoke("ffmpeg-record-screen", ...args),
    exitRecording: () => ipcRenderer.invoke("ffmpeg-exit-recording"),

    createTranscodeServer: port => ipcRenderer.invoke("create-transcode-server", port),
    on: (channel, callback) => ipcRenderer.on(channel, callback)
});