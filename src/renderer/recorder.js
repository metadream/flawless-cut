import { $ } from "./component.js";

/**
 * 录屏和录音组件
 * @since 2025-11-20
 */
export default new class Recorder {

    constructor() {
        this.container = $(`
            <div class="recorder"><div>
                <div class="duration">00:00:00.00</div>
                <button class="start">Start</button>
                <button class="stop">Stop</button>
            </div></div>
        `);

        this.duration = this.container.querySelector(".duration");
        this.startBtn = this.container.querySelector("button.start");
        this.stopBtn = this.container.querySelector("button.stop");
        document.body.appendChild(this.container);

        this.container.onclick = e => this.onMaskClick(e);
        this.startBtn.onclick = () => this.startRecording();
        this.stopBtn.onclick = () => this.stopRecording();

        // 监听录制过程事件
        ffmpeg.on("recording-update", (event, time) => {
            this.duration.innerHTML = time;
        });

        // 监听录制退出事件
        ffmpeg.on("recording-exit", () => {
            this.startBtn.disabled = false;
            this.startBtn.style.display = "block";
            this.stopBtn.style.display = "none";
            this.duration.innerHTML = "00:00:00.00";
            this.container.onclick = e => this.onMaskClick(e);
            this.hide();
        });
    }

    async startRecording() {
        this.startBtn.disabled = true;
        this.stopBtn.disabled = false;
        this.startBtn.style.display = "none";
        this.stopBtn.style.display = "block";
        this.container.onclick = null;
        ffmpeg.recordScreen(await electron.getDesktop());
    }

    stopRecording() {
        this.stopBtn.disabled = true;
        ffmpeg.exitRecording();
    }

    onMaskClick(e) {
        if (e.currentTarget === e.target) this.hide();
    }

    show() {
        this.container.classList.add("visible");
    }

    hide() {
        this.container.classList.remove("visible");
    }

}