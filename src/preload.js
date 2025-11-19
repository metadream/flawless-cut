// Cannot use ESModule if "nodeIntegration" is false
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bridge', {
    openFileDialog: (multiple = false) => {
        return ipcRenderer.invoke('open-file-dialog', multiple);
    }
});

// globalThis.addEventListener('DOMContentLoaded', () => {
//     console.log('------------------------------------111')
//     // Create elements for alert
//     const message = $('<div class="message"><div></div></div>')
//     message.content = message.querySelector('div')
//     document.body.appendChild(message)
//
//     // Create elements for loading
//     const loading = $('<div class="loading"><div class="loader"></div><div class="pointer"></div></div>')
//     loading.pointer = loading.querySelector('.pointer')
//     document.body.appendChild(loading)
//
//     // Integrate into window
//     Object.assign(window, {
//         alert(text) {
//             message.content.innerHTML = text
//             message.content.classList.add('visible')
//
//             // Auto hide
//             if (message.timer) clearTimeout(message.timer)
//             message.timer = setTimeout(function() {
//                 message.content.classList.remove('visible')
//             }, 3000)
//         },
//
//         loading(progress) {
//             if (progress === false || progress === 100) {
//                 loading.style.display = 'none'
//                 loading.pointer.innerHTML = ''
//             } else {
//                 loading.style.display = 'block'
//                 loading.pointer.innerHTML = Number.isInteger(progress) ? progress : ''
//             }
//         }
//     })
//
// })