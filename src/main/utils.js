/** 检测是否为数字 */
export function isNumeric(string) {
    return Number.isFinite(parseFloat(string))
}

/** 将日期对象格式化为 yyyy-MM-dd HH:mm:ss.SSS */
export function formatDate(date) {
    const month = String(date.getMonth() + 1).padStart(2, 0),
        days = String(date.getDate()).padStart(2, 0),
        hours = String(date.getHours()).padStart(2, 0),
        mins = String(date.getMinutes()).padStart(2, 0),
        secs = String(date.getSeconds()).padStart(2, 0)
    return `${date.getFullYear()}-${month}-${days} ${hours}.${mins}.${secs}`
}

/** 将毫秒时长格式化为 00:00:00.000 */
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

/** 将 00:00:00.000 字符串解析为毫秒时长 */
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