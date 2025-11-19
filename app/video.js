const http = require('http')
const ffmpeg = require('./ffmpeg')
const host = 'http://127.0.0.1:4725'

module.exports = {

  async setSource(source) {
    this.metadata = await ffmpeg.getMediaInfo(source)
    this.source = source
    this.src = source
    this.isTranscoded = false
    this.startTime = 0
    this.onchange && this.onchange()
  },

  getDuration() {
    return this.getMetadata('General.Duration')
  },

  getCurrentTime() {
    return this.currentTime + this.startTime
  },

  getMetadata(key) {
    let i = 0, value = this.metadata
    key = key.split('.')
    while (value && i < key.length) {
      value = value[key[i]]; i++
    }
    return isNumber(value) ? Number(value) : value
  },

  transcode() {
    if (!this.isTranscoded) {
      this.isTranscoded = true
      this.seek(0)
      this.createServer()
    }
  },

  seek(timestamp) {
    if (!isNumber(timestamp)) return
    if (timestamp < 0) timestamp = 0
    else if (timestamp > this.getDuration()) timestamp = this.getDuration()

    if (this.isTranscoded) {
      this.src = host + '?source=' + this.source + '&fileSize=' + this.getMetadata('General.FileSize') + '&startTime=' + timestamp
      this.startTime = timestamp
    } else {
      this.currentTime = timestamp
    }
  },

  createServer() {
    if (this.server && this.server.listening) return

    this.server = http.createServer((request, response) => {
      const params = parseQuery(request.url)
      const ffProc = ffmpeg.fastCodec(params.source, params.fileSize, params.startTime)
      ffProc.stdout.pipe(response)

      request.on('close', () => {
        ffProc.stdout.destroy()
        ffProc.stderr.destroy()
        ffProc.kill()
      })
    }).listen(4725)

    this.server.on('error', err => {
      alert(err.message)
    })
  }

}