import { formatDuration, parseDuration } from "../main/utils.js";
import { $, Toast } from "./component.js";
import recorder from "./recorder.js";
import video from "./video.js";
import merger from "./merger.js";

const metaInfo = $(".metadata");
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

const infoBtn = $(".info");
const cutBtn = $(".cut");
const captureBtn = $(".capture");
const extractBtn = $(".extract");
const convertBtn = $(".convert");
const openRecordBtn = $(".open-record");
const openFilesBtn = $(".open-files");
const repoBtn = $(".repo");

/**
 * 视频播放组件
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

        // 设置视频片段的起始点
        cutStartBtn.onclick = () => {
            segmentStartTime.value = formatDuration(video.currentTime);
            this.createSegment();
        }
        cutEndBtn.onclick = () => {
            segmentEndTime.value = formatDuration(video.currentTime);
            this.createSegment();
        }

        // 跳转到视频片段的起始点
        segmentStartBtn.onclick = () => {
            video.seek(parseDuration(segmentStartTime.value));
        }
        segmentEndBtn.onclick = () => {
            video.seek(parseDuration(segmentEndTime.value));
        }

        // 跳转到整个视频的起始点
        videoStartBtn.onclick = () => {
            video.seek(0);
        }
        videoEndBtn.onclick = () => {
            video.seek(video.duration);
        }

        // 跳转到时间轴点击位置
        timeline.onclick = function(e) {
            if (video.duration !== undefined) {
                video.seek(video.duration * (e.clientX / this.offsetWidth));
            }
        }

        // 输入视频片段起始时间
        const self = this;
        segmentStartTime.oninput = segmentEndTime.oninput = function() {
            video.seek(parseDuration(this.value));
            self.createSegment();
        }

        // 截取视频当前帧作为图片
        captureBtn.onclick = function() {
            ffmpeg.captureImage(video.source, video.currentTime);
        }

        // 从视频片段中提取音频
        extractBtn.onclick = () => {
            ffmpeg.extractAudio(
                video.source,
                video.getMetadata("Audio.BitRate"),
                this.segmentStartTime,
                this.segmentEndTime
            );
        }

        // 重编码分割视频
        convertBtn.onclick = () => {
            ffmpeg.convertVideo(video.source, this.segmentStartTime, this.segmentEndTime);
        }

        // 无损分割视频
        cutBtn.onclick = () => {
            ffmpeg.cutVideo(video.source, this.segmentStartTime, this.segmentEndTime);
        }

        // 录屏和录音
        openRecordBtn.onclick = function() {
            recorder.show();
        }

        // 打开多选文件对话框
        openFilesBtn.onclick = async function() {
            const { canceled, filePaths } = await electron.openFileDialog(true);
            if (canceled || !filePaths) return;
            if (filePaths.length > 1) {
                merger.sources = filePaths;
            } else {
                Toast.warn("You must choose at least two files to merge");
            }
        }

        // 打开元数据面板
        infoBtn.onclick = function() {
            metaInfo.classList.toggle("show");
        }

        // 打开 Github 项目仓库
        repoBtn.onclick = function() {
            electron.openExternal("https://github.com/metadream/flawless-cut");
        }

        // 快捷键绑定
        document.onkeyup = function(e) {
            e.preventDefault();
            if (video.duration === undefined) return;

            switch (e.code) {
                case "Space":
                    playBtn.onclick();
                    break;
                case "ArrowLeft":
                    video.seek(video.currentTime - (e.altKey ? 10 : 1));
                    break;
                case "ArrowRight":
                    video.seek(video.currentTime + (e.altKey ? 10 : 1));
                    break;
                case "Backquote":
                    infoBtn.click();
                    break;
            }
        }
    }

    /** 设置视频文件路径 */
    async setSource(filePath) {
        this.resetControls();
        this.enableControls(false);
        await video.setSource(filePath);
    }

    /** 创建视频片段 */
    createSegment() {
        segment.style.left = (parseDuration(segmentStartTime.value) / video.duration) * 100 + "%";
        segment.style.right = (100 - (parseDuration(segmentEndTime.value) / video.duration) * 100) + "%";
    }

    /** 重置面板控制元素 */
    resetControls() {
        this.status = "play";
        progress.style.left = "0";
        segment.style.left = "0";
        segment.style.right = "100%";
        duration.innerHTML = "00:00:00.000";
        segmentStartTime.value = "00:00:00.000";
        segmentEndTime.value = "00:00:00.000";
        metaInfo.innerHTML = "";
    }

    /** 启用或禁用面板控制元素 */
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

        infoBtn.disabled = v;
        cutBtn.disabled = v;
        captureBtn.disabled = v;
        extractBtn.disabled = v;
        convertBtn.disabled = v;
    }

    /** 更新时间轴 */
    updateTimeline() {
        currentTime.innerHTML = formatDuration(video.currentTime);
        progress.style.left = (video.currentTime / video.duration) * 100 + "%";
    }

    /** 显示媒体信息 */
    async displayMediaInfo() {
        const format = video.getMetadata("General.Format") || "";
        const frameRate = video.getMetadata("General.FrameRate");
        const bitRate = video.getMetadata("General.OverallBitRate");
        const samplingRate = video.getMetadata("Audio.SamplingRate");
        const metadata = { Format: format };

        if (video.getMetadata("Video")) {
            const width = video.getMetadata("Video.Width");
            const height = video.getMetadata("Video.Height");
            metadata["Dimensions"] = width + "×" + height;
        }

        if (frameRate) metadata["Frame Rate"] = parseFloat(frameRate.toFixed(2)) + "fps";
        if (bitRate) metadata["Bit Rate"] = Math.round(bitRate / 1000) + "kbps";
        if (samplingRate) metadata["Sampling Rate"] = parseFloat((samplingRate / 1000).toFixed(1)) + "kHz";

        // 设置元数据面板内容
        metaInfo.innerHTML = Object.entries(metadata).map(([key, value]) => {
            return `<tr><td align="right">${key}</td><td>:</td><td align="left">${value}</td></tr>`
        }).join("");

        // 设置标题栏内容
        const filename = video.source.split(/[\\/]/).pop();
        document.title = (await electron.getAppName()) + "  |  " + filename;
    }

    /** 更新播放时长显示 */
    updateDuration() {
        duration.innerHTML = segmentEndTime.value = formatDuration(video.duration);
    }

    set status(v) { playBtn.className = v; }

    get paused() { return playBtn.className === "pause"; }

    get segmentStartTime() { return segmentStartTime.value; }

    get segmentEndTime() { return segmentEndTime.value; }

}