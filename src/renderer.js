// import { Video } from "./video.js";
import { $ } from "./utils.js";

const fileChooser = $('#file-chooser');
// const video = new Video();

/* --------------------------------------------------------
 * Open file events
 * ----------------------------------------------------- */

fileChooser.ondragover = function() {
    return false;
}

fileChooser.ondragenter = function(e) {
    e.preventDefault();
    this.classList.add('ondrag');
}

fileChooser.ondragleave = function(e) {
    e.preventDefault();
    this.classList.remove('ondrag');
}

fileChooser.ondrop = function(e) {
    e.preventDefault();
    video.setPath(e.dataTransfer.files[0].path);
}

fileChooser.onclick = async function() {
    const { canceled, filePaths } = await bridge.openFileDialog();
    if (!canceled && filePaths && filePaths.length == 1) {
        video.setPath(filePaths[0]);
    }
}