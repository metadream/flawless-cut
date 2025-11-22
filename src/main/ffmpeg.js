import { formatDate, formatDuration, parseDuration } from "./utils.js";
import { app } from "electron";
import { EventEmitter } from "events";
import { Readable } from "stream";
import { execFile } from "child_process";
import path from "path";

// Get binary file on different platforms
const platform = process.platform;
const postfix = platform === "win32" ? ".exe" : "";
const mediainfo = path.join(app.getAppPath(), `bin/${platform}/mediainfo` + postfix);
const ffmpeg = path.join(app.getAppPath(), `bin/${platform}/ffmpeg` + postfix);

/**
 * Component: Ffmpeg and MediaInfo Tools
 * @since 2025-11-20
 */
export default new class Ffmpeg {

    /** Get metadata from media */
    getMediaInfo(inputFile) {
        return new Promise((resolve, reject) => {
            execFile(mediainfo, [inputFile, "--Output=JSON"], (error, stdout) => {
                if (error) {
                    reject(new Error("Failed to get media metadata."));
                    return;
                }
                if (stdout.trim()) {
                    const mediaTrack = JSON.parse(stdout).media.track;
                    const mediaInfo = {};
                    // @type: General, Video, Audio, ...
                    mediaTrack.forEach(track => mediaInfo[track["@type"]] = track);
                    resolve(mediaInfo);
                }
            });
        });
    }

    /** Lossless cut video */
    cutVideo(inputFile, startTime, endTime) {
        const outputFile = this.#buildOutputFile(inputFile, startTime, endTime);
        const segment = this.#parseSegment(startTime, endTime);
        if (!segment) return;

        // -i 放在-ss之后表示使用关键帧技术，放在-ss之前表示不使用关键帧技术；
        // 使用关键帧截取速度快，但时间不精确；并且如果结尾不是关键帧，则可能出现一段空白（参数 avoid_negative_ts 可解决）
        // 不使用关键帧剪切后视频开头可能存在几秒定格画面；
        return this.#ffmpegCommand([
            "-ss", segment.start, "-t", segment.duration, "-accurate_seek", "-i", inputFile,
            "-vcodec", "copy", "-acodec", "copy", "-avoid_negative_ts", 1, "-y", outputFile
        ]);
    }

    /** Re-encode video with regular mode */
    convertVideo(inputFile, startTime, endTime) {
        const outputFile = this.#buildOutputFile(inputFile, startTime, endTime, ".mp4");
        const segment = this.#parseSegment(startTime, endTime);
        if (!segment) return;

        // crf=18 is very close to lossless
        return this.#ffmpegCommand([
            "-i", inputFile, "-ss", segment.start, "-t", segment.duration,
            "-c:v", "libx264", "-preset:v", "veryfast", "-crf", 18, "-y", outputFile
        ]);
    }

    /** Record screen to video */
    async recordVideo(outputPath) {
        const outputFile = outputPath + "\\screen-record-" + formatDate(new Date()) + ".mp4";
        const audioDevice = await this.#getAudioDevice();
        const audioArgs = audioDevice ? ["-f", "dshow", "-i", "audio=" + audioDevice] : [];

        return this.#ffmpegCommand([
            "-f", "gdigrab", "-i", "desktop", ...audioArgs,
            "-c:v", "libx264", "-c:a", "aac", "-q:a", 0,
            "-y", outputFile
        ]);
    }

    /** Merge all videos to one */
    mergeVideos(inputFiles) {
        const outputFile = inputFiles[0] + "-merged" + path.extname(inputFiles[0]);
        const process = this.#ffmpegCommand([
            "-f", "concat", "-safe", "0", "-protocol_whitelist", "file,pipe",
            "-i", "pipe:0", "-c", "copy", "-y", outputFile
        ]);

        const videoList = inputFiles.map(p => "file '" + p + "'").join("\n");
        Readable.from(videoList).pipe(process.stdin);
        return process;
    }

    /** Extract audio from video */
    extractAudio(inputFile, bitRate, startTime, endTime) {
        const segment = this.#parseSegment(startTime, endTime);
        if (!segment) return;

        const args = bitRate ? (bitRate > 320000 ? ["-b:a", "320k"] : ["-b:a", bitRate]) : ["-q:a", 0];
        const outputFile = this.#buildOutputFile(inputFile, startTime, endTime, ".mp3");
        return this.#ffmpegCommand([
            "-ss", segment.start, "-t", segment.duration, "-i", inputFile,
            ...args, "-vn", "-y", outputFile
        ]);
    }

    /** Capture image from current frame of video */
    captureImage(inputFile, seconds) {
        const time = formatDuration(seconds);
        const outputFile = this.#buildOutputFile(inputFile, time, 1, ".jpg");
        return this.#ffmpegCommand([
            "-ss", time, "-i", inputFile, "-vframes", 1,
            "-f", "mjpeg", "-q:v", 2, "-y", outputFile
        ]);
    }

    /** Fast transcode video and output buffer */
    fastCodec(inputFile, fileSize, startTime) {
        // -frag_duration: Create fragments that are duration microseconds long.
        return this.#ffmpegCommand([
            "-ss", startTime, "-i", inputFile, "-preset:v", "ultrafast",
            "-f", "mp4", "-frag_duration", 1000000, "pipe:1"
        ], {
            encoding: "buffer", maxBuffer: Number(fileSize)
        });
    }

    /** Execute ffmpeg binary */
    #ffmpegCommand(args, options) {
        const emitter = new EventEmitter();
        emitter.emit("start");

        const process = execFile(ffmpeg, args, options, (error, _stdout, stderr) => {
            if (stderr instanceof Buffer) return;
            emitter.emit("finish");

            if (error) {
                error = error.toString().trim();
                error = error.substring(error.lastIndexOf("\n") + 1);
                error = error.substring(error.lastIndexOf(":") + 1);
                emitter.emit("error", new Error(error));
            } else {
                emitter.emit("success");
            }
        });

        process.stderr.on("data", stderr => {
            const match = / time=(\d{2}:\d{2}:\d{2}\.\d{2,3}) /.exec(stderr);
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
        return Object.assign(process, { emitter });
    }

    /** Get audio device */
    #getAudioDevice() {
        // TODO 各平台获取音频设备的参数不同
        return new Promise(resolve => {
            execFile(ffmpeg, ["-list_devices", "true", "-f", "dshow", "-i", "dummy"], (_error, _stdout, stderr) => {
                const lines = stderr.split("\n");
                lines.some((line, i) => {
                    let match = /^\[dshow.+\] DirectShow audio devices$/.exec(line.trim());
                    if (match) {
                        match = /^\[dshow.+\] +"(.+)"$/.exec(lines[i + 1].trim());
                        if (match) resolve(match[1]);
                        return true;
                    }
                });
            });
        });
    }

    /** Parse segment */
    #parseSegment(startTime, endTime) {
        const start = parseDuration(startTime);
        const end = parseDuration(endTime);
        if (start >= end) {
            throw new Error("Start time cannot be later than end time");
        }
        return {
            start, duration: end - start
        }
    }

    /** Format filename */
    #buildOutputFile(inputFile, startTime, endTime, extname) {
        const suffix = ("-" + startTime + "-" + endTime).replace(/:/g, ".");
        return inputFile + suffix + (extname || path.extname(inputFile));
    }
}