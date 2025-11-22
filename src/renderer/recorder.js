import { $ } from "./component.js";

/**
 * Component: Screen Recorder
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
        `)

        this.duration = this.container.querySelector(".duration")
        this.startBtn = this.container.querySelector("button.start")
        this.stopBtn = this.container.querySelector("button.stop")
        document.body.appendChild(this.container)

        this.container.onclick = e => this.onMaskClick(e)
        this.startBtn.onclick = () => this.createProcess()
        this.stopBtn.onclick = () => this.exitProcess()

        ffmpeg.on("process-timeupdate", (event, time) => {
            this.duration.innerHTML = time
            if (!this.started) {
                this.started = true
                this.startBtn.style.display = "none"
                this.stopBtn.style.display = "block"
                this.container.onclick = null
                electron.createTray();
            }
        });
        ffmpeg.on("process-exit", () => {
            this.started = false
            this.startBtn.disabled = false
            this.startBtn.style.display = "block"
            this.stopBtn.style.display = "none"
            this.container.onclick = e => this.onMaskClick(e);
        });
    }

    async createProcess() {
        this.startBtn.disabled = true
        await ffmpeg.recordVideo(await electron.getDesktop());
    }

    exitProcess() {
        ffmpeg.exitProcess();
        electron.removeTray();
    }

    onMaskClick(e) {
        if (e.currentTarget === e.target) {
            this.container.classList.remove("visible")
        }
    }

    show() {
        this.container.classList.add("visible")
    }

}