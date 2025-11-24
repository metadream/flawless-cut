/** 查找或创建DOM元素快捷方式 */
export function $(selector) {
    selector = selector.replace("/\n/mg", "").trim()
    if (selector.startsWith("<")) {
        return document.createRange().createContextualFragment(selector).firstChild
    }
    return document.querySelector(selector)
}

/** 消息提示组件 */
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

/** 进度显示组件 */
export const Loading = new class {
    constructor() {
        this.loading = $(".loading");
        this.pointer = this.loading.querySelector(".pointer");
    }

    show() {
        this.pointer.innerHTML = "";
        this.loading.style.display = "block";
    }

    update(progress) {
        this.pointer.innerHTML = progress;
        this.loading.style.display = "block";
        if (progress >= 100) this.hide();
    }

    hide() {
        this.pointer.innerHTML = "";
        this.loading.style.display = "none";
    }
}