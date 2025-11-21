const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld('electron', {
    getAppName: () => ipcRenderer.invoke('get-app-name'),
    getAppPath: () => ipcRenderer.invoke('get-app-path'),
    getDesktop: () => ipcRenderer.invoke('get-desktop'),
    createTray: () => ipcRenderer.invoke("create-tray"),
    removeTray: () => ipcRenderer.invoke("remove-tray"),
    openFileDialog: (multiple = false) => ipcRenderer.invoke("open-file-dialog", multiple),
    createTranscodeServer: (port) => ipcRenderer.invoke("create-transcode-server", port)
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