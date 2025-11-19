const electron = require('electron')
const ffmpeg = require('./ffmpeg')
const videoEnhanced = require('./video')
const Player = require('./player')
const Merger = require('./merger')
const Recorder = require('./recorder')

// Feature buttons
const openFileBtn = $('#open-file')
const captureBtn = $('.capture')
const extractBtn = $('.extract')
const convertBtn = $('.convert')
const cutBtn = $('.cut')
const openFilesBtn = $('.open-files')
const openRecordBtn = $('.open-record')
const helpBtn = $('.help')

// Components
const { dialog } = require('@electron/remote')
const video = Object.assign($('video'), videoEnhanced)
const player = new Player(video)
const merger = new Merger()
const recorder = new Recorder()

/* --------------------------------------------------------
 * Open file events
 * ----------------------------------------------------- */

openFileBtn.ondragover = function() {
  return false
}

openFileBtn.ondragenter = function(e) {
  e.preventDefault()
  this.classList.add('ondrag')
}

openFileBtn.ondragleave = function(e) {
  e.preventDefault()
  this.classList.remove('ondrag')
}

openFileBtn.ondrop = function(e) {
  e.preventDefault()
  const path = e.dataTransfer.files[0].path
  if (path) video.setSource(path)
}

openFileBtn.onclick = async function() {
  const { canceled, filePaths } = await openFileDialog()
  if (!canceled && filePaths && filePaths.length == 1) {
    video.setSource(filePaths[0])
  }
}

openFilesBtn.onclick = async function() {
  const { canceled, filePaths } = await openFileDialog(true)
  if (!canceled && filePaths && filePaths.length > 1) {
    video.sources = filePaths
    merger.setFileList(filePaths)
  }
}

openRecordBtn.onclick = function() {
  recorder.show()
}

/* --------------------------------------------------------
 * Feature Events
 * ----------------------------------------------------- */

captureBtn.onclick = function() {
  ffmpeg.captureImage(video)
}

extractBtn.onclick = function() {
  ffmpeg.extractAudio(video, player.getSegmentStartTime(), player.getSegmentEndTime())
}

convertBtn.onclick = function() {
  ffmpeg.convertVideo(video.source, player.getSegmentStartTime(), player.getSegmentEndTime())
}

cutBtn.onclick = function() {
  ffmpeg.cutVideo(video.source, player.getSegmentStartTime(), player.getSegmentEndTime())
}

helpBtn.onclick = function() {
  electron.shell.openExternal('https://github.com/metadream/flawless-cut')
}

/* --------------------------------------------------------
 * Player Events
 * ----------------------------------------------------- */

player.onload = function() {
  openFileBtn.style.opacity = 0
  cutBtn.disabled = false
  captureBtn.disabled = false
  extractBtn.disabled = false
  convertBtn.disabled = false
}

player.onerror = function() {
  openFileBtn.style.opacity = 1
  cutBtn.disabled = true
  captureBtn.disabled = true
  extractBtn.disabled = true
  convertBtn.disabled = true
}

/* --------------------------------------------------------
 * Merger Events
 * ----------------------------------------------------- */

merger.onmerge = function() {
  ffmpeg.mergeVideos(video.sources)
}

/* --------------------------------------------------------
 * Private Methods
 * ----------------------------------------------------- */

function openFileDialog(multiple = false) {
  return dialog.showOpenDialog({
    properties: ['openFile', multiple ? 'multiSelections' : false],
    filters: [
      { name: 'Media Files', extensions: [
        '3gp', 'asf', 'avi', 'dat', 'flv',
        'mkv', 'mov', 'mp4', 'mpg', 'mpeg', 'ogg', 'rm', 'rmvb', 'vob', 'wmv',
        'aac', 'ape', 'alac', 'flac', 'mp3', 'wav'
      ]},
      { name: 'All Files', extensions: ['*'] }
    ]
  })
}