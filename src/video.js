import { isNumeric, showLoading, showMessage } from "./utils.js";
import { Player } from "./player.js";
import audio from "./audio.js";
import ffmpeg from "./ffmpeg.js";
import http from "node:http";

const fileChooser = $('#file-chooser');
const video = $('video');
const host = 'http://127.0.0.1:4725';
let player = null;

/**
 * Component: Video Object
 * @since 2025-08-15
 */
export class Video {

    filePath = null;
    metadata = null;
    server = null;
    transcoded = false;
    startTime = 0;
    currentTime = 0;

    constructor() {
        player = new Player(this);

        video.onloadstart = function() {
            showLoading(true);
        }

        video.onloadedmetadata = () => {
            fileChooser.style.opacity = 0;
            player.enableControls(true);
            showLoading(false);
        }

        video.oncanplay = () => {
            if (player.isPaused()) {  // TODO 是否可去掉此判断
                video.play();
            }
        }

        video.ontimeupdate = () => {
            player.updateTimeline();
        }

        video.onended = () => {
            video.pause();
            player.setStatus('play');
        }

        video.onerror = () => {
            if (this.transcoded) {
                fileChooser.style.opacity = 1;
                player.enableControls(false);
                showLoading(false);
                showMessage('Unsupported video format');
            } else {
                showMessage('This video needs transcoding, playback will be slower');
                this.transcode();
            }
        }
    }

    transcode() {
        if (!this.transcoded) {
            this.transcoded = true;
            this.seek(0);
            this.createServer();
        }
    }

    seek(timestamp) {
        if (!isNumeric(timestamp)) return;
        if (timestamp < 0) timestamp = 0;
        else if (timestamp > this.getDuration()) timestamp = this.getDuration();

        if (this.transcoded) {
            this.src = host + '?source=' + this.source + '&fileSize=' + this.getMetadata('General.FileSize') + '&startTime=' + timestamp;
            this.startTime = timestamp;
        } else {
            this.currentTime = timestamp;
        }
    }

    async setPath(filePath) {
        video.src = 'file://' + filePath;
        this.filePath = filePath;
        this.transcoded = false;
        this.startTime = 0;
        player.resetControls();
        player.enableControls(false);

        this.metadata = await ffmpeg.getMediaInfo(filePath);
        if (this.getDuration()) {
            player.updateDuration();
            player.displayMetadata();
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

    createServer() {
        if (this.server && this.server.listening) return;

        this.server = http.createServer((request, response) => {
            const params = parseQuery(request.url);
            const ffProc = ffmpeg.fastCodec(params.source, params.fileSize, params.startTime);
            ffProc.stdout.pipe(response);

            request.on('close', () => {
                ffProc.stdout.destroy();
                ffProc.stderr.destroy();
                ffProc.kill();
            });
        }).listen(4725);

        this.server.on('error', e => {
            showMessage(e.message);
        });
    }

}