const outputPath = "";  // require('@electron/remote').getGlobal('desktop') // TODO 同级目录
import { $ } from "./utils.js";

export default new class Recorder {
    constructor() {
        this.container = $(`
            <div class="recorder"><div>
                <div class="duration">00:00:00.00</div>
                <button class="start">Start</button>
                <button class="stop">Stop</button>
            </div></div>
        `)

        this.duration = this.container.querySelector('.duration')
        this.startBtn = this.container.querySelector('button.start')
        this.stopBtn = this.container.querySelector('button.stop')
        document.body.appendChild(this.container)

        this.container.onclick = e => this.onmaskclick(e)
        this.startBtn.onclick = () => this.createProcess()
        this.stopBtn.onclick = () => this.exitProcess()
    }

    async createProcess() {
        this.startBtn.disabled = true
        this.process = await ffmpeg.recordVideo(outputPath)

        this.process.ontimeupdate = res => {
            this.duration.innerHTML = res
            if (!this.started) {
                this.started = true
                this.startBtn.style.display = 'none'
                this.stopBtn.style.display = 'block'
                this.container.onclick = null
                desktop.createTray();
            }
        }
        this.process.on('exit', () => {
            this.started = false
            this.startBtn.disabled = false
            this.startBtn.style.display = 'block'
            this.stopBtn.style.display = 'none'
            this.container.onclick = e => this.onmaskclick(e)
        })
    }

    exitProcess() {
        this.process.stdin.write('q')
        desktop.removeTray();
    }

    onmaskclick(e) {
        if (e.currentTarget === e.target) {
            this.container.classList.remove('visible')
        }
    }

    show() {
        this.container.classList.add('visible')
    }

}