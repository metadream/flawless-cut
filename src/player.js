const timeline = $('.timeline');
const currentTime = $('#currentTime');
const duration = $('#duration');
const segment = $('#segment');
const progress = $('#progress');
const segmentStartTime = $('#segment-start-time');
const segmentEndTime = $('#segment-end-time');

const playBtn = $('.play');
const videoStartBtn = $('.video-start');
const videoEndBtn = $('.video-end');
const segmentStartBtn = $('.segment-start');
const segmentEndBtn = $('.segment-end');
const cutStartBtn = $('.cut-start');
const cutEndBtn = $('.cut-end');

const cutBtn = $('.cut');
const captureBtn = $('.capture');
const extractBtn = $('.extract');
const convertBtn = $('.convert');

/**
 * Component: Player Controls
 * @Since 2025-08-15
 */
export default new class {

    setStatus(v) {
        playBtn.className = v;
    }

    isPaused() {
        return playBtn.className === 'play';
    }

    reset() {
        progress.style.left = 0;
        segment.style.left = 0;
        segment.style.right = '100%';
        playBtn.className = 'play';
        duration.innerHTML = '00:00:00.000';
        segmentStartTime.value = '00:00:00.000';
        segmentEndTime.value = '00:00:00.000';
    }

    enable(v) {
        v = !v;
        playBtn.disabled = v;
        videoStartBtn.disabled = v;
        videoEndBtn.disabled = v;
        segmentStartBtn.disabled = v;
        segmentEndBtn.disabled = v;
        cutStartBtn.disabled = v;
        cutEndBtn.disabled = v;
        segmentStartTime.disabled = v;
        segmentEndTime.disabled = v;

        cutBtn.disabled = v;
        captureBtn.disabled = v;
        extractBtn.disabled = v;
        convertBtn.disabled = v;
    }

    updateTime(time, duration) {
        currentTime.innerHTML = formatDuration(time);
        progress.style.left = (time / duration) * 100 + '%';
    }

}