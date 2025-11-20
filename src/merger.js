import { $ } from "./utils.js";

/**
 * Component: Merger Component
 * @since 2025-11-20
 */
export default new class Merger {
    constructor() {
        this.container = $(`
            <div class="merger">
                <div class="content">
                    <div class="title">File List</div><ol></ol>
                </div>
                <div class="footer">
                    <button class="merge">Merge</button>
                    <button class="cancel">Cancel</button>
                </div>
            </div>
        `);

        this.fileList = this.container.querySelector('ol');
        const mergeBtn = this.container.querySelector('button.merge');
        const cancelBtn = this.container.querySelector('button.cancel');
        document.body.appendChild(this.container);

        mergeBtn.onclick = () => {
            const proc = ffmpeg.mergeVideos(this.filePaths);
            proc.emitter.on('start', () => loading(true));
            proc.emitter.on('finish', () => loading(false));
            proc.emitter.on('progress', p => loading(p));
            proc.emitter.on('error', e => toast(e.message));
        }

        cancelBtn.onclick = () => {
            this.container.style.display = 'none';
        }
    }

    set sources(filePaths) {
        this.filePaths = filePaths;
        this.container.style.display = 'flex';
        this.fileList.innerHTML = '';

        filePaths.forEach(filePath => {
            this.fileList.appendChild($('<li>' + (filePath) + '</li>'));
        });
    }

}