/**
 * --------------------------------------------------------
 * Preload and Enhancements
 *
 * All of the Node.js APIs are available in the preload process.
 * It has the same sandbox as a Chrome extension.
 * --------------------------------------------------------
 */

globalThis.addEventListener('DOMContentLoaded', () => {

  // Create elements for alert
  const message = $('<div class="message"><div></div></div>')
  message.content = message.$('div')
  document.body.appendChild(message)

  // Create elements for loading
  const loading = $('<div class="loading"><div class="loader"></div><div class="pointer"></div></div>')
  loading.pointer = loading.$('.pointer')
  document.body.appendChild(loading)

  // Integrate into window
  Object.assign(window, {
    alert(text) {
      message.content.innerHTML = text
      message.content.classList.add('visible')

      // Auto hide
      if (message.timer) clearTimeout(message.timer)
      message.timer = setTimeout(function() {
        message.content.classList.remove('visible')
      }, 3000)
    },

    loading(progress) {
      if (progress === false || progress === 100) {
        loading.style.display = 'none'
        loading.pointer.innerHTML = ''
      } else {
        loading.style.display = 'block'
        loading.pointer.innerHTML = Number.isInteger(progress) ? progress : ''
      }
    }
  })

})

/* --------------------------------------------------------
 * Window Enhancements
 * ----------------------------------------------------- */

Object.assign(window, {

  $(selector) {
    selector = selector.replace('/\n/mg', '').trim()
    if (selector.startsWith('<')) {
      return document.createRange().createContextualFragment(selector).firstChild
    }
    return document.querySelector(selector)
  },

  isNumber(string) {
    return Number.isFinite(parseFloat(string))
  },

  parseQuery(queryString) {
    const index = queryString.indexOf('?')
    queryString = index > -1 ? queryString.substring(index+1) : queryString

    const result = {}
    const params = queryString.split('&')
    params.forEach(param => {
      const item = param.split('=')
      result[item[0]] = decodeURI(item[1])
    })
    return result
  },

  formatDuration(_seconds) {
    const seconds = _seconds || 0
    const minutes = seconds / 60
    const hours = minutes / 60

    const hoursPadded = String(Math.floor(hours)).padStart(2, 0)
    const minutesPadded = String(Math.floor(minutes % 60)).padStart(2, 0)
    const secondsPadded = String(Math.floor(seconds) % 60).padStart(2, 0)
    const msPadded = String(Math.floor((seconds - Math.floor(seconds)) * 1000)).padStart(3, 0)

    return `${hoursPadded}:${minutesPadded}:${secondsPadded}.${msPadded}`
  },

  parseDuration(str) {
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

})

/* --------------------------------------------------------
 * Element Enhancements
 * ----------------------------------------------------- */

Object.assign(Element.prototype, {
  $(selector) {
    return this.querySelector(selector)
  }
})

/* --------------------------------------------------------
 * Date Enhancements
 * ----------------------------------------------------- */

Object.assign(Date.prototype, {
  format() {
    const month = String(this.getMonth() + 1).padStart(2, 0),
      days = String(this.getDate()).padStart(2, 0),
      hours = String(this.getHours()).padStart(2, 0),
      mins = String(this.getMinutes()).padStart(2, 0),
      secs = String(this.getSeconds()).padStart(2, 0)
    return `${this.getFullYear()}-${month}-${days} ${hours}.${mins}.${secs}`
  }
})