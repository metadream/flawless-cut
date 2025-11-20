const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktop", {
    openFileDialog: (multiple = false) => ipcRenderer.invoke("open-file-dialog", multiple),
    createTray: () => ipcRenderer.invoke("create-tray"),
    removeTray: () => ipcRenderer.invoke("remove-tray")
});

contextBridge.exposeInMainWorld("ffmpeg", {
    getMediaInfo: (...args) => ipcRenderer.invoke("ffmpeg-media-info", ...args),
    cutVideo: (...args) => ipcRenderer.invoke("ffmpeg-cut-video", ...args),
    convertVideo: (...args) => ipcRenderer.invoke("ffmpeg-convert-video", ...args),
    recordVideo: (...args) => ipcRenderer.invoke("ffmpeg-record-video", ...args),
    mergeVideos: (...args) => ipcRenderer.invoke("ffmpeg-merge-videos", ...args),
    extractAudio: (...args) => ipcRenderer.invoke("ffmpeg-extract-audio", ...args),
    captureImage: (...args) => ipcRenderer.invoke("ffmpeg-capture-image", ...args)
});