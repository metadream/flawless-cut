import { $, Loading, Toast } from "./component.js";
import player from "./player.js";

/** 拖拽文件方式 */
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

/** 选择文件方式 */
fileChooser.onclick = async function() {
    const { canceled, filePaths } = await electron.openFileDialog();
    if (!canceled && filePaths && filePaths.length === 1) {
        player.setSource(filePaths[0]);
    }
}

/** FFMPEG 进程事件监听 */
ffmpeg.on("process-start", () => {
    Loading.show();
});
ffmpeg.on("process-progress", (event, progress) => {
    Loading.update(progress);
});
ffmpeg.on("process-complete", () => {
    Loading.hide();
    Toast.success("Process completed.")
});
ffmpeg.on("process-error", (event, message) => {
    Loading.hide();
    Toast.error(message);
});
ffmpeg.on("transcode-error", (event, message) => {
    Loading.hide();
    Toast.error(message);
});