import { $ } from "./component.js";

const canvas = $("canvas");
const audio = $("video");

/**
 * 音频声波组件
 * @since 2025-11-20
 */
export default new class Audio {
    constructor() {
        this.ctx = canvas.getContext("2d");
        this.options = {
            accuracy: 256,
            width: 1024,
            height: 600,
            maxHeight: 160,
            minHeight: 1,
            spacing: 1,
            color: "#ff422d",
            verticalAlign: "middle"
        };

        this.playing = false;
        this.#initContext();
    }

    play() {
        if (!this.playing) {
            this.playing = true;
            this.#animate();
            canvas.style.display = "block";
        }
    }

    pause() {
        this.playing = false;
    }

    hide() {
        canvas.style.display = "none";
    }

    #initContext() {
        const audioContext = new AudioContext();
        const audioSource = audioContext.createMediaElementSource(audio);

        this.analyser = audioContext.createAnalyser();
        audioSource.connect(this.analyser);
        this.analyser.fftSize = this.options.accuracy * 2;
        this.analyser.connect(audioContext.destination);
        this.freqByteData = new Uint8Array(this.analyser.frequencyBinCount);

        const dpr = window.devicePixelRatio || 1;
        this.ctx.canvas.width = this.options.width * dpr;
        this.ctx.canvas.height = this.options.height * dpr;
        this.ctx.scale(dpr, dpr);
    }

    #animate() {
        if (this.playing) {
            this.analyser.getByteFrequencyData(this.freqByteData);
            this.#visualize(this.freqByteData);
            requestAnimationFrame(() => this.#animate());
        }
    }

    #visualize(freqByteData) {
        const o = this.options;
        this.ctx.clearRect(0, 0, o.width, o.height);

        const _freqByteData = [].concat(
            Array.from(freqByteData).reverse().splice(o.accuracy / 2, o.accuracy / 2),
            Array.from(freqByteData).splice(0, o.accuracy / 2)
        );

        _freqByteData.forEach((value, index) => {
            const width = (o.width - o.accuracy * o.spacing) / o.accuracy;
            let left = index * (width + o.spacing);
            o.spacing !== 1 && (left += o.spacing / 2);

            let top, height = value / 256 * o.maxHeight;
            height = height < o.minHeight ? o.minHeight : height;

            switch (o.verticalAlign) {
                case "top":
                    top = 0;
                    break;
                case "bottom":
                    top = o.height - height;
                    break;
                default:
                    top = (o.height - height) / 2;
                    break;
            }

            if (o.color instanceof Array) {
                const linearGradient = this.ctx.createLinearGradient(left, top, left, top + height);
                let pos;

                o.color.forEach((color, index) => {
                    if (color instanceof Array) {
                        pos = color[0];
                        color = color[1];
                    } else if (index === 0 || index === o.color.length - 1) {
                        pos = index / (o.color.length - 1);
                    } else {
                        pos = index / o.color.length + 0.5 / o.color.length;
                    }
                    linearGradient.addColorStop(pos, color);
                })

                this.ctx.fillStyle = linearGradient;
            } else {
                this.ctx.fillStyle = o.color;
            }

            if (index <= o.accuracy / 2) {
                this.ctx.globalAlpha = 1 - (o.accuracy / 2 - 1 - index) / (o.accuracy / 2);
            } else {
                this.ctx.globalAlpha = 1 - (index - o.accuracy / 2) / (o.accuracy / 2);
            }

            this.ctx.fillRect(left, top, width, height);
        });
    }
}