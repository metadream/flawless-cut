import { showLoading, showMessage } from "./utils.js";
import opener from "./opener.js";
import player from "./player.js";
import audio from "./audio.js";

const video = $('video');

/**
 * Component: Video Object
 * @Since 2025-08-15
 */
export default new class {

    metadata = null;

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
            player.updateTime(video.getCurrentTime(), this.getDuration());
        }

        video.onended = function() {
            this.pause();
            player.setStatus('play');
        }

        video.onerror = function() {
            if (video.isTranscoded) {
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

    setPath(filePath) {
        video.src = video.path = filePath;
        video.isTranscoded = false;
        video.startTime = 0;

        // this.metadata = await ffmpeg.getMediaInfo(source)  // TODO
        player.reset();
        player.enable(false);

        // TODO
        if (this.getDuration()) {
            duration.innerHTML = segmentEndTime.value = formatDuration(this.getDuration());
            this.showMetadataOnTitle();
        }

        if (video.getMetadata('Audio') && !video.getMetadata('Video')) {
            audio.play();
        } else {
            audio.pause();
            audio.hide();
        }
    }

    getCurrentTime() {
        return this.currentTime + this.startTime;
    }

    // TODO
    getDuration() {
        return this.getMetadata('General.Duration');
    }

}