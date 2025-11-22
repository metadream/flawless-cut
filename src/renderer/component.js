/** Shortcut for query selector or create elements */
export function $(selector) {
    selector = selector.replace("/\n/mg", "").trim()
    if (selector.startsWith("<")) {
        return document.createRange().createContextualFragment(selector).firstChild
    }
    return document.querySelector(selector)
}

/** Toast Component */
export const Toast = new class {
    constructor() {
        this.el = $(".toast>div");
    }

    info(message) {
        this.el.innerHTML = message;
        this.el.classList.add("visible");

        // Auto hide
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            this.el.classList.remove("visible");
        }, 3000);
    }

    success(message) {
        this.el.className = "success";
        this.info(message);
    }

    warn(message) {
        this.el.className = "warn";
        this.info(message);
    }

    error(message) {
        this.el.className = "error";
        this.info(message);
    }
}

/** Loading component */
export function loading(progress) {
    const loading = $(".loading");
    loading.pointer = loading.querySelector(".pointer");
    if (progress === false || progress === 100) {
        loading.style.display = "none";
        loading.pointer.innerHTML = "";
    } else {
        loading.style.display = "block";
        loading.pointer.innerHTML = Number.isInteger(progress) ? progress : "";
    }
}