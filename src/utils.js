/** Shortcut for query selector or create elements */
export function $(selector) {
    selector = selector.replace('/\n/mg', '').trim()
    if (selector.startsWith('<')) {
        return document.createRange().createContextualFragment(selector).firstChild
    }
    return document.querySelector(selector)
}

/** Format date to pattern */
export function formatDate(date) {
    const month = String(date.getMonth() + 1).padStart(2, 0),
        days = String(date.getDate()).padStart(2, 0),
        hours = String(date.getHours()).padStart(2, 0),
        mins = String(date.getMinutes()).padStart(2, 0),
        secs = String(date.getSeconds()).padStart(2, 0)
    return `${date.getFullYear()}-${month}-${days} ${hours}.${mins}.${secs}`
}

/** Format seconds to pattern */
export function formatDuration(_seconds) {
    const seconds = _seconds || 0
    const minutes = seconds / 60
    const hours = minutes / 60

    const hoursPadded = String(Math.floor(hours)).padStart(2, 0)
    const minutesPadded = String(Math.floor(minutes % 60)).padStart(2, 0)
    const secondsPadded = String(Math.floor(seconds) % 60).padStart(2, 0)
    const msPadded = String(Math.floor((seconds - Math.floor(seconds)) * 1000)).padStart(3, 0)

    return `${hoursPadded}:${minutesPadded}:${secondsPadded}.${msPadded}`
}

/** Parse duration from string */
export function parseDuration(str) {
    if (!str) return
    const match = str.trim().match(/^(\d{2}):(\d{2}):(\d{2})(\.\d{2,3})$/)

    if (!match) return
    const hours = parseInt(match[1], 10)
    const minutes = parseInt(match[2], 10)
    const seconds = parseInt(match[3], 10)
    const ms = parseFloat(match[4])

    if (hours > 59 || minutes > 59 || seconds > 59) return
    return (hours * 60 + minutes) * 60 + seconds + ms
}