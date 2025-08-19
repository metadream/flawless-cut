import { Video } from "./video.js";

const fileDialog = $('#file-dialog');
const fileChooser = $('#file-chooser');
const video = new Video();

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

// Open code repository by default browser
$('button.repo').onclick = function() {
    nw.Shell.openExternal(nw.App.manifest.repository);
}

// Open devtools in the development environment
if (process.env.NODE_ENV === 'development') {
    nw.Window.get().showDevTools();
}