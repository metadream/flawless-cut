import { $, Loading, Toast } from "./component.js";
import player from "./player.js";

/** Drag to play */
const fileChooser = $("#file-chooser");
fileChooser.ondragover = function() {
    return false;
}
fileChooser.ondragenter = function(e) {
    e.preventDefault();
    this.classList.add("ondrag");
}
fileChooser.ondragleave = function(e) {
    e.preventDefault();
    this.classList.remove("ondrag");
}
fileChooser.ondrop = function(e) {
    e.preventDefault();
    const path = electron.getFilePath(e.dataTransfer.files[0]);
    player.setSource(path);
}

/** Choose to play */
fileChooser.onclick = async function() {
    const { canceled, filePaths } = await electron.openFileDialog();
    if (!canceled && filePaths && filePaths.length === 1) {
        player.setSource(filePaths[0]);
    }
}

/** Listen ffmpeg process events */
ffmpeg.on("process-start", () => Loading.show());
ffmpeg.on("process-finish", () => Loading.hide());
ffmpeg.on("process-success", () => Toast.success("File output successful"));
ffmpeg.on("process-progress", (event, progress) => Loading.update(progress));
ffmpeg.on("process-error", (event, message) => Toast.error(message));
ffmpeg.on("transcode-error", (event, message) => Toast.error(message));