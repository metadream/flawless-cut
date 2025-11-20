// Cannot use ESModule if "nodeIntegration" is false
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("bridge", {
    openFileDialog: (multiple = false) => {
        return ipcRenderer.invoke("open-file-dialog", multiple);
    },

    createTray: () => {
        ipcRenderer.invoke("create-tray");
    },

    removeTray: () => {
        ipcRenderer.invoke("remove-tray");
    }
});