const children = new Set();

export function register(child) {
    children.add(child);
    child.on("exit", () => {
        children.delete(child);
    });
}

export function killAll() {
    for (const child of children) {
        try {
            child.kill("SIGKILL");
        } catch (e) {
            child.kill("SIGTERM");
        }
    }
}