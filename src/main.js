import "./opener.js";
import ffmpeg from "./ffmpeg.js";

const metadata = await ffmpeg.getMediaInfo("C:\\Users\\Administrator\\Videos\\rc.mp4");
console.log(metadata);

// Open repo by default browser
$('button.repo').onclick = function() {
    nw.Shell.openExternal(nw.App.manifest.repository);
}