import fs from "fs";
import path from "path";
import { app } from "electron";

const logFile = path.join(app.getPath("desktop"), 'myapp.log');

export default function log(msg) {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
}