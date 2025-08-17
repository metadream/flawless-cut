import "./opener.js";

if (process.env.NODE_ENV === 'development') {
    nw.Window.get().showDevTools();
}

// Open repo by default browser
$('button.repo').onclick = function() {
    nw.Shell.openExternal(nw.App.manifest.repository);
}