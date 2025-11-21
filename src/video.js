import { $, isNumeric } from "./utils.js";
import player from "./player.js";
import ffmpeg from "./ffmpeg.js";

const fileChooser = $("#file-chooser");
const video = $("video");

/**
 * Component: Video Instance
 * @since 2025-11-20
 */
export default new class Video {

    metadata = null;
    transcoded = false;
    startTime = 0;

    constructor() {
        video.onloadstart = async () => {
            loading(true);
            this.metadata = await ffmpeg.getMediaInfo(video.src);
        }

        video.onloadedmetadata = () => {
            fileChooser.style.opacity = 0;
            player.enableControls(true);
            loading(false);
        }

        video.oncanplay = () => {
            if (player.paused) {
                video.play();
            }
        }

        video.ontimeupdate = () => {
            player.updateTimeline();
        }

        video.onended = () => {
            video.pause();
            player.status = "play";
        }

        video.onerror = () => {
            if (this.transcoded) {
                fileChooser.style.opacity = 1;
                player.enableControls(false);
                loading(false);
                toast("Unsupported video format");
            } else {
                toast("This video needs transcoding, playback will be slower");
                this.transcode();
            }
        }
    }

    transcode() {
        if (!this.transcoded) {
            this.transcoded = true;
            this.seek(0);
        }

        // Create transcode server if it doesn't exist
        if (this.server && this.server.listening) return;
        this.server = electron.createTranscodeServer();
        this.server.on("error", e => {
            toast(e.message);
        });
    }

    seek(timestamp) {
        if (!isNumeric(timestamp)) return;
        if (timestamp < 0) timestamp = 0;
        else if (timestamp > this.duration) timestamp = this.duration;

        if (this.transcoded) {
            this.startTime = timestamp;
            video.src = "?source=" + video.originSrc + "&fileSize=" + this.getMetadata("General.FileSize") + "&startTime=" + timestamp;
        } else {
            video.currentTime = timestamp;
        }
    }

    // Get metadata by property key
    getMetadata(key) {
        let i = 0, value = this.metadata;
        key = key.split(".");
        while (value && i < key.length) {
            value = value[key[i]];
            i++;
        }
        return isNumeric(value) ? Number(value) : value;
    }

    play() { video.play(); }

    pause() { video.pause(); }

    set src(path) { video.src = video.originSrc = path; }

    get src() { return video.src; }

    get paused() { return video.paused; }

    get ended() { return video.ended; }

    get currentTime() { return video.currentTime + this.startTime; }

    get duration() { return this.getMetadata("General.Duration"); }

}