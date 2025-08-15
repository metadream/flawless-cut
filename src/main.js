import "./opener.js";

// Open repo by default browser
$('button.repo').onclick = function() {
    nw.Shell.openExternal(nw.App.manifest.repository);
}