import { execSync } from "child_process";

export default new class Subprocess {
    constructor() {
        this.children = new Set();
    }

    register(child) {
        this.children.add(child);
        child.unref();
        child.on("exit", () => {
            this.children.delete(child);
        });
    }

    killAll() {
        for (const child of this.children) {
            const pid = child.pid;
            if (!this.#isAlive(pid)) {
                this.children.delete(child);
                continue;
            }

            try {
                if (process.platform === "win32") {
                    execSync(`taskkill /pid ${pid} /T /F`);
                } else {
                    process.kill(-pid, "SIGKILL");
                }
            } catch (e) {
                if (e.code !== "ESRCH") {
                    console.error("Kill child process failed:", err);
                }
            }
        }
    }

    #isAlive(pid) {
        try {
            process.kill(pid, 0);
            return true;
        } catch (e) {
            return false;
        }
    }
}