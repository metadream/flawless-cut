const { app } = require('@electron/remote')
const Wave = require('./wave')

const timeline = $('.timeline')
const currentTime = $('#currentTime')
const duration = $('#duration')
const segment = $('#segment')
const progress = $('#progress')
const segmentStartTime = $('#segment-start-time')
const segmentEndTime = $('#segment-end-time')

const playBtn = $('.play')
const videoStartBtn = $('.video-start')
const videoEndBtn = $('.video-end')
const segmentStartBtn = $('.segment-start')
const segmentEndBtn = $('.segment-end')
const cutStartBtn = $('.cut-start')
const cutEndBtn = $('.cut-end')

module.exports = class {

  constructor(video) {
    this.wave = new Wave(video, $('canvas'))

    function createSegment() {
      segment.style.left = (parseDuration(segmentStartTime.value) / video.getDuration()) * 100 + '%'
      segment.style.right = (100 - (parseDuration(segmentEndTime.value) / video.getDuration()) * 100) + '%'
    }

    /* --------------------------------------------------------
     * Button events
     * ----------------------------------------------------- */

    playBtn.onclick = () => {
      if (video.paused) {
        if (video.ended) video.seek(0)
        video.play()
        playBtn.className = 'pause'
      } else {
        video.pause()
        playBtn.className = 'play'
      }
    }

    cutStartBtn.onclick = () => {
      segmentStartTime.value = formatDuration(video.getCurrentTime())
      createSegment()
    }

    cutEndBtn.onclick = () => {
      segmentEndTime.value = formatDuration(video.getCurrentTime())
      createSegment()
    }

    segmentStartBtn.onclick = () => {
      video.seek(parseDuration(segmentStartTime.value))
    }

    segmentEndBtn.onclick = () => {
      video.seek(parseDuration(segmentEndTime.value))
    }

    videoStartBtn.onclick = () => {
      video.seek(0)
    }

    videoEndBtn.onclick = () => {
      video.seek(video.getDuration())
    }

    /* --------------------------------------------------------
     * Video events
     * ----------------------------------------------------- */

    video.onchange = () => {
      this.resetControls()
      this.disableBtns(true)

      if (video.getDuration()) {
        duration.innerHTML = segmentEndTime.value = formatDuration(video.getDuration())
        this.showMetadataOnTitle()
      }
      if (video.getMetadata('Audio') && !video.getMetadata('Video')) {
        this.wave.play()
      } else {
        this.wave.pause()
        this.wave.hide()
      }
    }

    video.onloadstart = () => {
      loading(true)
    }

    video.onloadedmetadata = () => {
      loading(false)
      this.disableBtns(false)
      this.onload()
    }

    video.oncanplay = () => {
      if (playBtn.className == 'pause') {
        video.play()
      }
    }

    video.ontimeupdate = () => {
      currentTime.innerHTML = formatDuration(video.getCurrentTime())
      progress.style.left = (video.getCurrentTime() / video.getDuration()) * 100 + '%'
    }

    video.onended = () => {
      video.pause()
      playBtn.className = 'play'
    }

    video.onerror = () => {
      if (video.isTranscoded) {
        alert('Unsupported video format')
        loading(false)
        this.onerror()
      } else {
        alert('This video needs transcoding, playback will be slower')
        video.transcode()
      }
    }

    /* --------------------------------------------------------
     * Other events
     * ----------------------------------------------------- */

    timeline.onclick = function(e) {
      if (video.getDuration() !== undefined)
      video.seek(video.getDuration() * (e.clientX / this.offsetWidth))
    }

    segmentStartTime.oninput = segmentEndTime.oninput = function() {
      video.seek(parseDuration(this.value))
      createSegment()
    }

    document.onkeyup = function(e) {
      e.preventDefault()
      if (video.getDuration() === undefined) return
      if (e.keyCode === 32) return playBtn.onclick()   // SPACE
      if (e.keyCode === 37) return video.seek(video.getCurrentTime() - 1)  // LEFT
      if (e.keyCode === 39) return video.seek(video.getCurrentTime() + 1)  // RIGHT
    }
  }

  getSegmentStartTime() {
    return segmentStartTime.value
  }

  getSegmentEndTime() {
    return segmentEndTime.value
  }

  showMetadataOnTitle() {
    const format = video.getMetadata('General.Format') || ''
    const frameRate = video.getMetadata('General.FrameRate')
    const bitRate = video.getMetadata('General.OverallBitRate')
    const samplingRate = video.getMetadata('Audio.SamplingRate')

    const metadata = [ format ]
    if (frameRate) metadata.push(parseFloat(frameRate.toFixed(2)) + 'fps')
    if (bitRate)  metadata.push(Math.round(bitRate / 1000) + 'kbps')
    if (samplingRate)  metadata.push(parseFloat((samplingRate / 1000).toFixed(1)) + 'kHz')
    document.title = app.name + '  |  ' + metadata.join(', ')
  }

  resetControls() {
    progress.style.left = 0
    segment.style.left = 0
    segment.style.right = '100%'
    playBtn.className = 'play'
    duration.innerHTML = '00:00:00.000'
    segmentStartTime.value = '00:00:00.000'
    segmentEndTime.value = '00:00:00.000'
  }

  disableBtns(bool) {
    playBtn.disabled = bool
    videoStartBtn.disabled = bool
    videoEndBtn.disabled = bool
    segmentStartBtn.disabled = bool
    segmentEndBtn.disabled = bool
    cutStartBtn.disabled = bool
    cutEndBtn.disabled = bool
    segmentStartTime.disabled = bool
    segmentEndTime.disabled = bool
  }

}