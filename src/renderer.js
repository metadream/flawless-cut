import { $ } from "./utils.js";
import player from "./player.js";

const fileChooser = $('#file-chooser');
const toast = $('.toast');
const loading = $('.loading');

/** Drag to play */
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
    player.source = e.dataTransfer.files[0].path;
}

/** Choose to play */
fileChooser.onclick = async function() {
    const { canceled, filePaths } = await electron.openFileDialog();
    if (!canceled && filePaths && filePaths.length == 1) {
        player.source = filePaths[0];
    }
}

/** Web components */
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