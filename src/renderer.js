// import { Video } from "./video.js";
import { $ } from "./utils.js";

const fileChooser = $('#file-chooser');
const toast = $('.toast');
const loading = $('.loading');

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

/* --------------------------------------------------------
 * Web Components
 * ----------------------------------------------------- */

Object.assign(window, {
    toast(text) {
        toast.message = toast.querySelector('div');
        toast.message.innerHTML = text;
        toast.message.classList.add('visible');

        // Auto hide
        if (toast.timer) clearTimeout(toast.timer);
        toast.timer = setTimeout(function() {
            toast.message.classList.remove('visible');
        }, 3000);
    },

    loading(progress) {
        loading.pointer = loading.querySelector('.pointer');
        if (progress === false || progress === 100) {
            loading.style.display = 'none';
            loading.pointer.innerHTML = '';
        } else {
            loading.style.display = 'block';
            loading.pointer.innerHTML = Number.isInteger(progress) ? progress : '';
        }
    }
});