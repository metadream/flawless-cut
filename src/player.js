import { formatDuration, parseDuration } from "./utils.js";

const timeline = $('.timeline');
const currentTime = $('#currentTime');
const duration = $('#duration');
const segment = $('#segment');
const progress = $('#progress');
const segmentStartTime = $('#segment-start-time');
const segmentEndTime = $('#segment-end-time');

const playBtn = $('.play');
const videoStartBtn = $('.video-start');
const videoEndBtn = $('.video-end');
const segmentStartBtn = $('.segment-start');
const segmentEndBtn = $('.segment-end');
const cutStartBtn = $('.cut-start');
const cutEndBtn = $('.cut-end');

const cutBtn = $('.cut');
const captureBtn = $('.capture');
const extractBtn = $('.extract');
const convertBtn = $('.convert');
const openRecordBtn = $('.open-record');

let video = null;
// const merger = new Merger();
// const recorder = new Recorder();

/**
 * Component: Player Controls
 * @since 2025-08-15
 */
export class Player {

    constructor(_video) {
        video = _video;

        playBtn.onclick = () => {
            if (video.paused) {
                if (video.ended) video.seek(0);
                video.play();
                this.setPlayStatus('pause');
            } else {
                video.pause();
                this.setPlayStatus('play');
            }
        }

        cutStartBtn.onclick = () => {
            segmentStartTime.value = formatDuration(video.getCurrentTime());
            this.createSegment();
        }

        cutEndBtn.onclick = () => {
            segmentEndTime.value = formatDuration(video.getCurrentTime());
            this.createSegment();
        }

        segmentStartBtn.onclick = () => {
            video.seek(parseDuration(segmentStartTime.value));
        }

        segmentEndBtn.onclick = () => {
            video.seek(parseDuration(segmentEndTime.value));
        }

        videoStartBtn.onclick = () => {
            video.seek(0);
        }

        videoEndBtn.onclick = () => {
            video.seek(video.getDuration());
        }

        timeline.onclick = function(e) {
            if (video.getDuration() !== undefined) {
                video.seek(video.getDuration() * (e.clientX / this.offsetWidth));
            }
        }

        const self = this;
        segmentStartTime.oninput = segmentEndTime.oninput = function() {
            video.seek(parseDuration(this.value));
            self.createSegment();
        }

        captureBtn.onclick = function() {
            ffmpeg.captureImage(video);
        }

        extractBtn.onclick = () => {
            ffmpeg.extractAudio(video, this.getSegmentStartTime(), this.getSegmentEndTime());
        }

        convertBtn.onclick = () => {
            ffmpeg.convertVideo(video.filePath, this.getSegmentStartTime(), this.getSegmentEndTime());
        }

        cutBtn.onclick = () => {
            ffmpeg.cutVideo(video.filePath, this.getSegmentStartTime(), this.getSegmentEndTime());
        }

        openRecordBtn.onclick = function() {
            recorder.show()
        }

        document.onkeyup = function(e) {
            e.preventDefault();
            if (video.getDuration() === undefined) return;
            if (e.code === 'Space') return playBtn.onclick();
            if (e.code === 'ArrowLeft') return video.seek(video.getCurrentTime() - 1);
            if (e.code === 'ArrowRight') return video.seek(video.getCurrentTime() + 1);
        }
    }

    createSegment() {
        segment.style.left = (parseDuration(segmentStartTime.value) / video.getDuration()) * 100 + '%';
        segment.style.right = (100 - (parseDuration(segmentEndTime.value) / video.getDuration()) * 100) + '%';
    }

    setPlayStatus(v) {
        playBtn.className = v;
    }

    isPaused() {
        return playBtn.className === 'play';
    }

    getSegmentStartTime() {
        return segmentStartTime.value;
    }

    getSegmentEndTime() {
        return segmentEndTime.value;
    }

    resetControls() {
        this.setPlayStatus('play');
        progress.style.left = 0;
        segment.style.left = 0;
        segment.style.right = '100%';
        duration.innerHTML = '00:00:00.000';
        segmentStartTime.value = '00:00:00.000';
        segmentEndTime.value = '00:00:00.000';
    }

    enableControls(v) {
        v = !v;
        playBtn.disabled = v;
        videoStartBtn.disabled = v;
        videoEndBtn.disabled = v;
        segmentStartBtn.disabled = v;
        segmentEndBtn.disabled = v;
        cutStartBtn.disabled = v;
        cutEndBtn.disabled = v;
        segmentStartTime.disabled = v;
        segmentEndTime.disabled = v;

        cutBtn.disabled = v;
        captureBtn.disabled = v;
        extractBtn.disabled = v;
        convertBtn.disabled = v;
    }

    updateTimeline() {
        const time = video.getCurrentTime();
        currentTime.innerHTML = formatDuration(time);
        progress.style.left = (time / video.getDuration()) * 100 + '%';
    }

    displayMetadata() {
        const format = video.getMetadata('General.Format') || '';
        const frameRate = video.getMetadata('General.FrameRate');
        const bitRate = video.getMetadata('General.OverallBitRate');
        const samplingRate = video.getMetadata('Audio.SamplingRate');

        const metadata = [format];
        if (frameRate) metadata.push(parseFloat(frameRate.toFixed(2)) + 'fps');
        if (bitRate) metadata.push(Math.round(bitRate / 1000) + 'kbps');
        if (samplingRate) metadata.push(parseFloat((samplingRate / 1000).toFixed(1)) + 'kHz');
        document.title = nw.App.manifest.window.title + '  |  ' + metadata.join(', ');
    }

    updateDuration() {
        duration.innerHTML = segmentEndTime.value = formatDuration(video.getDuration());
    }

}