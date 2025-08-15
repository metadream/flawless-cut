/** A shortcut for query and create elements */
window.$ = function(selector) {
    selector = selector.replace('/\n/mg', '').trim();
    if (selector.startsWith('<')) {
        return document.createRange().createContextualFragment(selector).firstChild;
    }
    return document.querySelector(selector);
}

window.println = function(obj) {
    process.stdout.write(JSON.stringify(obj, null, 2) + "\n");
}

/** Show message */
export function showMessage(text) {
    let message = $('div.message');
    if (!message) {
        message = $('<div class="message"><div></div></div>');
        document.body.append(message);
    }

    // Show text
    const content = message.querySelector('div');
    content.innerHTML = text;
    content.classList.add('visible');

    // Auto-hide after 5 seconds
    if (message.timer) {
        clearTimeout(message.timer);
    }
    message.timer = setTimeout(function() {
        content.classList.remove('visible');
    }, 5000);
}

/** Show loading */
export function showLoading(progress) {
    let loading = $('div.loading');
    if (!loading) {
        loading = $('<div class="loading"><div class="loader"></div><div class="pointer"></div></div>');
        document.body.append(loading);
    }

    const pointer = loading.querySelector('.pointer');
    if (progress === false || progress === 100) {
        loading.style.display = 'none';
        pointer.innerHTML = '';
    } else {
        loading.style.display = 'block';
        pointer.innerHTML = Number.isInteger(progress) ? progress : '';
    }
}

/** Determine whether the string is a number */
export function isNumeric(string) {
    return Number.isFinite(parseFloat(string));
}

/** Format date to 'yy-MM-dd hh:mm:ss' pattern */
export function formatDate() {
    const month = String(this.getMonth() + 1).padStart(2, 0),
        days = String(this.getDate()).padStart(2, 0),
        hours = String(this.getHours()).padStart(2, 0),
        mins = String(this.getMinutes()).padStart(2, 0),
        secs = String(this.getSeconds()).padStart(2, 0)
    return `${this.getFullYear()}-${month}-${days} ${hours}.${mins}.${secs}`;
}

/** Format seconds to 'hh:mm:ss.ms' pattern */
export function formatDuration(_seconds) {
    const seconds = _seconds || 0;
    const minutes = seconds / 60;
    const hours = minutes / 60;

    const hoursPadded = String(Math.floor(hours)).padStart(2, 0);
    const minutesPadded = String(Math.floor(minutes % 60)).padStart(2, 0);
    const secondsPadded = String(Math.floor(seconds) % 60).padStart(2, 0);
    const msPadded = String(Math.floor((seconds - Math.floor(seconds)) * 1000)).padStart(3, 0);

    return `${hoursPadded}:${minutesPadded}:${secondsPadded}.${msPadded}`;
}

/** Parse 'hh:mm:ss.ms' pattern to seconds */
export function parseDuration(str) {
    if (!str) return;
    const match = str.trim().match(/^(\d{2}):(\d{2}):(\d{2})(\.\d{2,3})$/);

    if (!match) return;
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const seconds = parseInt(match[3], 10);
    const ms = parseFloat(match[4]);

    if (hours > 59 || minutes > 59 || seconds > 59) return;
    return (hours * 60 + minutes) * 60 + seconds + ms;
}