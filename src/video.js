import { $, isNumeric } from "./utils.js";
import player from "./player.js";

const fileChooser = $('#file-chooser');
const video = $('video');

/**
 * Component: Video Component
 * @since 2025-11-20
 */
export default new class Video {

    metadata = null;
    transcoded = false;
    startTime = 0;

    constructor() {
        video.onloadstart = async () => {
            this.metadata = await ffmpeg.getMediaInfo(video.src);
            loading(true);
        }

        video.onloadedmetadata = () => {
            fileChooser.style.opacity = 0;
            player.enableControls(true);
            loading(false);
        }

        video.oncanplay = () => {
            if (player.paused) {  // TODO 是否可去掉此判断
                video.play();
            }
        }

        video.ontimeupdate = () => {
            player.updateTimeline();
        }

        video.onended = () => {
            video.pause();
            player.status = 'play';
        }

        video.onerror = () => {
            if (this.transcoded) {
                fileChooser.style.opacity = 1;
                player.enableControls(false);
                loading(false);
                toast('Unsupported video format');
            } else {
                toast('This video needs transcoding, playback will be slower');
                this.transcode();
            }
        }
    }

    transcode() {
        if (!this.transcoded) {
            this.transcoded = true;
            this.seek(0);
        }
    }

    seek(timestamp) {
        if (!isNumeric(timestamp)) return;
        if (timestamp < 0) timestamp = 0;
        else if (timestamp > this.duration) timestamp = this.duration;

        if (this.transcoded) {
            this.startTime = timestamp;
            video.src = '?source=' + this.filePath + '&fileSize=' + this.getMetadata('General.FileSize') + '&startTime=' + timestamp;
        } else {
            video.currentTime = timestamp;
        }
    }

    // TODO cache
    getMetadata(key) {
        let i = 0, value = this.metadata;
        key = key.split('.');
        while (value && i < key.length) {
            value = value[key[i]];
            i++;
        }
        return isNumeric(value) ? Number(value) : value;
    }

    /** Extends original video properties and methods  */
    play() { video.play(); }

    pause() { video.pause(); }

    set src(path) { video.src = path; }

    get src() { return video.src; }

    get paused() { return video.paused; }

    get ended() { return video.ended; }

    get currentTime() { return video.currentTime + this.startTime; }

    get duration() { return this.getMetadata('General.Duration'); }

}