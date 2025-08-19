import { isNumeric, showLoading, showMessage } from "./utils.js";
import opener from "./opener.js";
import player from "./player.js";
import audio from "./audio.js";
import ffmpeg from "./ffmpeg.js";

const video = $('video');

/**
 * Component: Video Object
 * @Since 2025-08-15
 */
export default new class {

    metadata = null;
    transcoded = false;
    startTime = 0;

    constructor() {
        video.onloadstart = function() {
            showLoading(true);
        }

        video.onloadedmetadata = function() {
            showLoading(false);
            opener.visible(false);
            player.enable(true);
        }

        video.oncanplay = function() {
            if (player.isPaused()) {  // TODO 是否可去掉此判断
                this.play();
            }
        }

        video.ontimeupdate = () => {
            player.updateTime(this.getCurrentTime(), this.getDuration());
        }

        video.onended = function() {
            this.pause();
            player.setStatus('play');
        }

        video.onerror = () => {
            if (this.transcoded) {
                showLoading(false);
                showMessage('Unsupported video format');
                opener.visible(true);
                player.enable(false);
            } else {
                showMessage('This video needs transcoding, playback will be slower');
                // video.transcode();  // TODO
            }
        }
    }

    async setPath(filePath) {
        video.path = filePath;
        video.src = 'file://' + filePath;
        this.startTime = 0;
        this.transcoded = false;
        player.reset();
        player.enable(false);

        this.metadata = await ffmpeg.getMediaInfo(filePath);

        if (this.getDuration()) {
            const format = this.getMetadata('General.Format') || ''
            const frameRate = this.getMetadata('General.FrameRate')
            const bitRate = this.getMetadata('General.OverallBitRate')
            const samplingRate = this.getMetadata('Audio.SamplingRate')
            player.displayMetadataOnTitle(format, frameRate, bitRate, samplingRate);
            player.resetDuration(this.getDuration());
        }

        if (this.getMetadata('Audio') && !this.getMetadata('Video')) {
            audio.play();
        } else {
            audio.pause();
            audio.hide();
        }
    }

    getCurrentTime() {
        return this.currentTime + this.startTime;
    }

    getDuration() {
        return this.getMetadata('General.Duration');
    }

    getMetadata(key) {
        let i = 0, value = this.metadata;
        key = key.split('.');
        while (value && i < key.length) {
            value = value[key[i]];
            i++;
        }
        return isNumeric(value) ? Number(value) : value;
    }

}