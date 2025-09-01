const { basename } = require('node:path');
import ffmpeg from "./ffmpeg.js";

export class Merger {

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
        this.mergeBtn = this.container.querySelector('button.merge');
        this.cancelBtn = this.container.querySelector('button.cancel');
        document.body.appendChild(this.container);

        this.mergeBtn.onclick = () => {
            this.mergeVideos();
        }
        this.cancelBtn.onclick = () => {
            this.container.style.display = 'none';
        }
    }

    mergeVideos() {
        ffmpeg.mergeVideos(video.sources);
    }

    setFileList(filePaths) {
        this.container.style.display = 'flex';
        this.fileList.innerHTML = '';

        filePaths.forEach(filePath => {
            this.fileList.appendChild($('<li>' + basename(filePath) + '</li>'));
        });
    }

}