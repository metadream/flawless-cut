import { $, formatDuration, parseDuration } from "./utils.js";
import video from "./video.js";
import merger from "./merger.js";
import audio from "./audio.js";
import recorder from "./recorder.js";

const timeline = $(".timeline");
const currentTime = $("#currentTime");
const duration = $("#duration");
const segment = $("#segment");
const progress = $("#progress");
const segmentStartTime = $("#segment-start-time");
const segmentEndTime = $("#segment-end-time");

const playBtn = $(".play");
const videoStartBtn = $(".video-start");
const videoEndBtn = $(".video-end");
const segmentStartBtn = $(".segment-start");
const segmentEndBtn = $(".segment-end");
const cutStartBtn = $(".cut-start");
const cutEndBtn = $(".cut-end");

const cutBtn = $(".cut");
const captureBtn = $(".capture");
const extractBtn = $(".extract");
const convertBtn = $(".convert");
const openRecordBtn = $(".open-record");
const openFilesBtn = $(".open-files");

/**
 * Component: Player Controls
 * @since 2025-11-20
 */
export default new class Player {

    constructor() {
        playBtn.onclick = () => {
            if (video.paused) {
                if (video.ended) video.seek(0);
                video.play();
                this.status = "pause";
            } else {
                video.pause();
                this.status = "play";
            }
        }

        // Create video segment by cut buttons
        cutStartBtn.onclick = () => {
            segmentStartTime.value = formatDuration(video.currentTime);
            this.createSegment();
        }
        cutEndBtn.onclick = () => {
            segmentEndTime.value = formatDuration(video.currentTime);
            this.createSegment();
        }

        // Seek to the beginning or end of the segment
        segmentStartBtn.onclick = () => {
            video.seek(parseDuration(segmentStartTime.value));
        }
        segmentEndBtn.onclick = () => {
            video.seek(parseDuration(segmentEndTime.value));
        }

        // Seek to the beginning or end of the video
        videoStartBtn.onclick = () => {
            video.seek(0);
        }
        videoEndBtn.onclick = () => {
            video.seek(video.duration);
        }

        // Seek to timeline position
        timeline.onclick = function(e) {
            if (video.duration !== undefined) {
                video.seek(video.duration * (e.clientX / this.offsetWidth));
            }
        }

        // Create segment by input time
        const self = this;
        segmentStartTime.oninput = segmentEndTime.oninput = function() {
            video.seek(parseDuration(this.value));
            self.createSegment();
        }

        // Take a snapshot of current frame from the video
        captureBtn.onclick = function() {
            ffmpeg.captureImage(video);
        }

        // Extract audio from the video segment
        extractBtn.onclick = () => {
            ffmpeg.extractAudio(video, this.segmentStartTime, this.segmentEndTime);
        }

        // Re-encode video segment to regular MP4 and export
        convertBtn.onclick = () => {
            ffmpeg.convertVideo(video.src, this.segmentStartTime, this.segmentEndTime);
        }

        // Lossless cut video segment and export
        cutBtn.onclick = () => {
            ffmpeg.cutVideo(video.src, this.segmentStartTime, this.segmentEndTime);
        }

        // TODO Record screen
        openRecordBtn.onclick = function() {
            recorder.show();
            var tray = new nw.Tray({ title: "Tray", icon: "img/icon.png" });

            // Give it a menu
            var menu = new nw.Menu();
            menu.append(new nw.MenuItem({
                // label: "box1", click: function() {
                //     nw.Window.get().show();
                // }
                label: "Click me",
                click: function() {
                    console.log("Im clicked");
                }
            }));
            tray.menu = menu;

            nw.Window.get().hide();
        }

        // TODO Open video segment files to merge
        openFilesBtn.onclick = async function() {
            const { canceled, filePaths } = await desktop.openFileDialog(true);
            if (!canceled && filePaths && filePaths.length > 1) {
                merger.sources = filePaths;
            }
        }

        // Key bindings // TODO test input
        document.onkeyup = function(e) {
            e.preventDefault();
            if (e.target.tagName === "INPUT" || video.duration === undefined)
                return;

            switch (e.code) {
                case "Space":
                    playBtn.onclick();
                    break;
                case "ArrowLeft":
                    video.seek(video.currentTime - 1);
                    break;
                case "ArrowRight":
                    video.seek(video.currentTime + 1);
                    break;
            }
        }
    }

    /** Create segment by start and end time */
    createSegment() {
        segment.style.left = (parseDuration(segmentStartTime.value) / video.duration) * 100 + "%";
        segment.style.right = (100 - (parseDuration(segmentEndTime.value) / video.duration) * 100) + "%";
    }

    /** Reset controls */
    resetControls() {
        this.status = "play";
        progress.style.left = 0;
        segment.style.left = 0;
        segment.style.right = "100%";
        duration.innerHTML = "00:00:00.000";
        segmentStartTime.value = "00:00:00.000";
        segmentEndTime.value = "00:00:00.000";
    }

    /** Enable controls */
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

    /** Update timeline */
    updateTimeline() {
        currentTime.innerHTML = formatDuration(video.currentTime);
        progress.style.left = (video.currentTime / video.duration) * 100 + "%";
    }

    /** Display metadata on the panel */
    displayMetadata() {
        const format = video.getMetadata("General.Format") || "";
        const frameRate = video.getMetadata("General.FrameRate");
        const bitRate = video.getMetadata("General.OverallBitRate");
        const samplingRate = video.getMetadata("Audio.SamplingRate");

        const metadata = [format];
        if (frameRate) metadata.push(parseFloat(frameRate.toFixed(2)) + "fps");
        if (bitRate) metadata.push(Math.round(bitRate / 1000) + "kbps");
        if (samplingRate) metadata.push(parseFloat((samplingRate / 1000).toFixed(1)) + "kHz");
        // TODO
        document.title = nw.App.manifest.window.title + "  |  " + metadata.join(", ");
    }

    /** Update duration */
    updateDuration() {
        duration.innerHTML = segmentEndTime.value = formatDuration(video.duration);
    }

    /** Set filepath to video source */
    set source(filePath) {
        video.src = filePath;
        video.startTime = 0;
        video.transcoded = false;

        this.resetControls();
        this.enableControls(false);

        if (video.duration) {
            this.updateDuration();
            this.displayMetadata();
        }

        if (video.getMetadata("Audio") && !video.getMetadata("Video")) {
            audio.play();
        } else {
            audio.pause();
            audio.hide();
        }
    }

    set status(v) { playBtn.className = v; }

    get paused() { return playBtn.className === "play"; }

    get segmentStartTime() { return segmentStartTime.value; }

    get segmentEndTime() { return segmentEndTime.value; }

}