import { execFileSync, spawn } from "child_process";
import { formatDate, formatDuration, parseDuration } from "./utils.js";
import { app } from "electron";
import { EventEmitter } from "events";
import os from "os";
import fs from "fs";
import path from "path";

/** 获取可执行性文件 */
const { platform } = process;
const mediainfo = getExecutablePath("mediainfo");
const ffmpeg = getExecutablePath("ffmpeg");

/** 获取媒体元数据 */
export function getMediaInfo(inputFile) {
    try {
        const stdout = execFileSync(mediainfo, [inputFile, "--Output=JSON"],
            { encoding: "utf8" });
        if (stdout.trim()) {
            const mediaTrack = JSON.parse(stdout).media.track;
            const mediaInfo = {};
            // @type: General, Video, Audio, ...
            mediaTrack.forEach(track => mediaInfo[track["@type"]] = track);
            return mediaInfo;
        }
    } catch (error) {
        throw new Error("Failed to get metadata from input file.");
    }
}

/** 无损分割视频 */
export function cutVideo(inputFile, startTime, endTime) {
    const outputFile = buildOutputFile(inputFile, startTime, endTime);
    const segment = parseSegment(startTime, endTime);
    if (!segment) return;

    // -ss放在-i之前表示使用关键帧技术，放在-i之后表示不使用关键帧技术；
    // 使用关键帧截取速度快，但时间不精确；并且如果结尾不是关键帧，则可能出现一段空白（参数 avoid_negative_ts 可解决）
    // 不使用关键帧剪切后视频开头可能存在几秒定格画面；
    return ffmpegCommand([
        "-ss", segment.start, "-t", segment.duration, "-accurate_seek", "-i", inputFile,
        "-vcodec", "copy", "-acodec", "copy", "-avoid_negative_ts", 1, "-y", outputFile
    ]);
}

/** 重编码分割视频 */
export function convertVideo(inputFile, startTime, endTime) {
    const outputFile = buildOutputFile(inputFile, startTime, endTime, ".mp4");
    const segment = parseSegment(startTime, endTime);
    const firstStart = Math.floor(segment.start);
    const secondStart = segment.start - firstStart;

    // 将起始时间拆分成整数部分和小数部分用于设置双-ss参数
    // 第一个-ss用于快速寻找最接近但小于该时间但关键帧，第二个-ss用于精确裁切
    // crf=18 参数非常接近无损分割
    return ffmpegCommand([
        "-ss", firstStart, "-i", inputFile, "-ss", secondStart, "-t", segment.duration,
        "-c:v", "libx264", "-preset:v", "veryfast", "-crf", 18, "-y", outputFile
    ]);
}

/** 录屏录音 */
export function recordScreen(outputPath) {
    const outputFile = path.join(outputPath, "screen-record-" + formatDate(new Date()) + ".mp4");
    let args = null;

    switch (platform) {
        // Windows需要获取录音设备名称
        case "win32":
            const audioDevice = getAudioDevice();
            const audioArgs = audioDevice ? ["-f", "dshow", "-i", "audio=" + audioDevice] : [];
            args = ["-f", "gdigrab", "-i", "desktop", ...audioArgs];
            break;
        // Linux默认帧率和分辨率可能比较低
        // :0.0表示获取第一个显示器的第一个屏幕，default选择系统默认输入设备
        case "linux":
            args = [
                "-f", "x11grab", "-framerate", 30,
                "-video_size", "1920x1080", "-i", ":0.0",
                "-f", "pulse", "-i", "default"
            ];
            break;
        // MacOS 1:0表示视频设备1（通常是主屏幕），音频设备0（通常是默认麦克风）。
        case "darwin":
            args = ["-f", "avfoundation", "-framerate", 30, "-i", '1:0'];
            break;
        default:
            throw new Error(`Unsupported platform ${platform}`);
    }

    return ffmpegCommand(args.concat([
        "-c:v", "libx264", "-c:a", "aac", "-q:a", 0, "-y", outputFile
    ]));
}

/** 合并多个视频 */
export function mergeVideos(inputFiles) {
    // 通过管道写入文件列表的方式报错：Readable.from(fileList).pipe(process.stdin);
    // 故改为创建临时文件方式作为输入
    const tmpFile = path.join(os.tmpdir(), "flawless-merge-list.txt");
    const fileList = inputFiles.map(p => `file '${p}'`).join("\n");
    fs.writeFileSync(tmpFile, fileList);

    const outputFile = inputFiles[0] + "-merged" + path.extname(inputFiles[0]);
    const proc = ffmpegCommand([
        "-f", "concat", "-safe", "0",
        "-i", tmpFile, "-c", "copy", "-y", outputFile
    ]);

    // 删除临时文件
    proc.on("error", () => {
        if (fs.existsSync(tmpFile)) {
            fs.unlinkSync(tmpFile);
        }
    });
    proc.on("close", () => {
        if (fs.existsSync(tmpFile)) {
            fs.unlinkSync(tmpFile);
        }
    });
    return proc;
}

/** 从视频中提取音频 */
export function extractAudio(inputFile, bitRate, startTime, endTime) {
    const segment = parseSegment(startTime, endTime);
    if (!segment) return;

    const args = bitRate ? (bitRate > 320000 ? ["-b:a", "320k"] : ["-b:a", bitRate]) : ["-q:a", 0];
    const outputFile = buildOutputFile(inputFile, startTime, endTime, ".mp3");
    return ffmpegCommand([
        "-ss", segment.start, "-t", segment.duration, "-i", inputFile,
        ...args, "-vn", "-y", outputFile
    ]);
}

/** 捕获视频当前帧作为图片 */
export function captureImage(inputFile, seconds) {
    const time = formatDuration(seconds);
    const outputFile = buildOutputFile(inputFile, time, 1, ".jpg");
    return ffmpegCommand([
        "-ss", time, "-i", inputFile, "-vframes", 1,
        "-f", "mjpeg", "-q:v", 2, "-y", outputFile
    ]);
}

/** 快速转码输出视频流 */
export function fastCodec(inputFile, fileSize, startTime) {
    // -frag_duration: Create fragments that are duration microseconds long.
    return ffmpegCommand([
        "-ss", startTime, "-i", inputFile, "-preset:v", "ultrafast",
        "-f", "mp4", "-frag_duration", 1000000, "pipe:1"
    ], {
        encoding: "buffer", maxBuffer: Number(fileSize)
    });
}

/** 执行 FFMPEG 命令 */
function ffmpegCommand(args, options) {
    const emitter = new EventEmitter();
    const proc = spawn(ffmpeg, args, options);

    // 监听进程开始事件
    proc.on("spawn", () => {
        emitter.emit("start");
    });

    // Ffmpeg的进度信息包含在标准错误输出中
    proc.stderr.on("data", (data) => {
        const match = / time=(\d{2}:\d{2}:\d{2}\.\d{2,3}) /.exec(data);
        if (match) {
            emitter.emit("timeupdate", match[1]);

            const index = args.indexOf("-t");
            if (index > -1) {
                const duration = args[index + 1];
                const progress = Math.round((parseDuration(match[1]) / duration) * 100);
                emitter.emit("progress", progress);
            }
        }
    });

    // 进程正常结束
    proc.on("close", () => {
        emitter.emit("complete");
    });

    // 无法创建进程或进程启动失败
    proc.on("error", (error) => {
        error = error.toString().trim();
        error = error.substring(error.lastIndexOf("\n") + 1);
        error = error.substring(error.lastIndexOf(":") + 1);
        emitter.emit("error", new Error(error));
    });

    return Object.assign(proc, { emitter });
}

/** 获取 Windows 音频输入设备 */
function getAudioDevice() {
    try {
        execFileSync(ffmpeg, ["-list_devices", "true", "-f", "dshow", "-i", "dummy"], {
            encoding: "utf8"
        });
    } catch (error) {
        // 设备信息包含在标准错误输出中
        const stderr = error.stderr || "";
        const lines = stderr.split("\n");

        // 解析设备名称
        for (let i = 0; i < lines.length; i++) {
            let match = /^\[dshow.+\] DirectShow audio devices$/.exec(lines[i].trim());
            if (match) {
                match = /^\[dshow.+\] +"(.+)"$/.exec(lines[i + 1].trim());
                if (match) return match[1];
            }
        }
        return null;
    }
}

/** 将起止时间解析为以秒为单位 */
function parseSegment(startTime, endTime) {
    const start = parseDuration(startTime);
    const end = parseDuration(endTime);
    if (start >= end) {
        throw new Error("Start time cannot be later than end time");
    }
    return {
        start, duration: end - start
    }
}

/** 构建输出文件名 */
function buildOutputFile(inputFile, startTime, endTime, extname) {
    const suffix = ("-" + startTime + "-" + endTime).replace(/:/g, ".");
    return inputFile + suffix + (extname || path.extname(inputFile));
}

/** 根据不同平台获取可执行性文件路径 */
function getExecutablePath(name) {
    const postfix = platform === "win32" ? ".exe" : "";
    return app.isPackaged
        ? path.join(process.resourcesPath, "bin", name + postfix)     // 打包后从资源目录获取
        : path.join(process.cwd(), "bin", platform, name + postfix);  // 开发时从项目目录获取
}