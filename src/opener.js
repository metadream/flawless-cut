import video from "./video.js";

const fileDialog = $('#file-dialog');
const fileChooser = $('#file-chooser');

/**
 * Component: Dialog Opener
 * @Since 2025-08-15
 */
export default new class {

    constructor() {
        // Event: click the main interface to open file dialog
        fileChooser.onclick = () => {
            fileDialog.click();
        }

        // Event: drag a media file to the main interface
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

        // Event: on file path changed
        fileDialog.onchange = function() {
            video.setPath(this.files[0].path);
        }
    }

    visible(v) {
        fileChooser.style.opacity = v ? 1 : 0;
    }

}