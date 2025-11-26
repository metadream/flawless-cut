import { app } from "electron";
import fs from "fs";
import path from "path";

// Electron默认日志路径
// Linux/Windows: userData/AppName
// MacOS: ~/Library/Logs/AppName
const logFile = path.join(app.getPath("logs"), "flawless-cut.log");

export function log(e) {
    const stack = e instanceof Error ? e.stack : String(e);
    const timestamp = new Date().toISOString();
    const message = `[${timestamp}] ${stack}\n${"-".repeat(80)}\n`;
    fs.appendFileSync(logFile, message);
}