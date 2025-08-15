const { execFile } = require('node:child_process');
const path = require("node:path");
const mediainfo = path.resolve(`bin/${process.platform}/mediainfo`);

export default new class {

    getMediaInfo(filePath) {
        return new Promise(resolve => {
            execFile(mediainfo, [filePath, '--Output=JSON'], (error, stdout) => {
                if (error) {
                    alert('Get media information failed')
                    return
                }
                if (stdout.trim()) {
                    const mediaTrack = JSON.parse(stdout).media.track
                    const mediaInfo = {}
                    // @type: General, Video, Audio, ...
                    mediaTrack.forEach(track => mediaInfo[track['@type']] = track)
                    resolve(mediaInfo)
                }
            })
        })
    }

}