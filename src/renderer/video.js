import { isNumeric } from "../main/utils.js";
import { $, Loading, Toast } from "./component.js";
import player from "./player.js";
import audio from "./audio.js";

const fileChooser = $("#file-chooser");
const video = $("video");

/**
 * 视频实例
 * @since 2025-11-20
 */
export default new class Video {

    metadata = null;
    transcoded = false;
    startTime = 0;

    constructor() {
        video.onloadstart = async () => {
            Loading.show();
        }

        video.onloadedmetadata = () => {
            fileChooser.style.opacity = 0;
            player.enableControls(true);
            Loading.hide();
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
                Loading.hide();
                Toast.error("Unsupported video format");
            } else {
                this.transcode();
            }
        }
    }

    async setSource(path) {
        this.transcoded = false;
        this.startTime = 0;
        this.metadata = await ffmpeg.getMediaInfo(path);

        if (!this.duration) {
            video.source = null;
            video.removeAttribute('src');
            video.load();
            fileChooser.style.opacity = 1;
            Toast.error("Not a media file");
            return;
        }

        // 更新播放器面板
        video.src = video.source = path;
        player.updateDuration();
        player.displayMetadata();

        // 自动播放音频
        if (this.getMetadata("Audio") && !this.getMetadata("Video")) {
            audio.play();
        } else {
            audio.pause();
            audio.hide();
        }
    }

    /** 创建转码服务 */
    async transcode() {
        if (!this.transcoded) {
            this.transcoded = true;
            this.seek(0);
            await ffmpeg.createTranscodeServer();
        }
    }

    /** 将视频跳转到指定时间 */
    seek(timestamp) {
        if (!isNumeric(timestamp)) return;
        if (timestamp < 0) timestamp = 0;
        else if (timestamp > this.duration) timestamp = this.duration;

        if (this.transcoded) {
            this.startTime = timestamp;
            video.src = "http://127.0.0.1:4725?source=" + this.source + "&fileSize=" + this.getMetadata("General.FileSize") + "&startTime=" + timestamp;
        } else {
            video.currentTime = timestamp;
        }
    }

    /** 根据属性名获取元数据 */
    getMetadata(key) {
        let i = 0, value = this.metadata;
        key = key.split(".");
        while (value && i < key.length) {
            value = value[key[i++]];
        }
        return isNumeric(value) ? Number(value) : value;
    }

    play() { video.play(); }

    pause() { video.pause(); }

    get source() { return video.source; }

    get paused() { return video.paused; }

    get ended() { return video.ended; }

    get currentTime() { return video.currentTime + this.startTime; }

    get duration() { return this.getMetadata("General.Duration"); }

}