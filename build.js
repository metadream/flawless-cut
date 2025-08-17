// 下载normal版本
// 解压
// 复制到dist
// 创建app.nw
// 替换图标
// 设置应用名称等
// 替换libffmpeg

import packageJson from './package.json' with { type: 'json' };
import compressing from 'compressing';
import fs from "node:fs";
import stream from 'node:stream';
import path from "node:path";

const tmpDir = './tmp';
await mkdirs(tmpDir);

const config = Object.assign({
    "mirror": "https://dl.nwjs.io",
    "version": "0.102.1",
    "platform": "linux-x64",
    "buildDir": "./dist",
    "files": []
}, packageJson.build);

const { mirror, version, platform, buildDir, files } = config;
const extname = platform.startsWith("linux") ? "tar.gz" : "zip";
const filename = `nwjs-v${version}-${platform}.${extname}`
const frameworkUrl = joinUrl(mirror, "v" + version, filename);
const frameworkFile = path.join(tmpDir, filename);

await download(frameworkUrl, frameworkFile);

if (extname == 'tar.gz') {
    await compressing.tgz.uncompress(frameworkFile, tmpDir);
} else {
    await compressing.zip.uncompress(frameworkFile, tmpDir);
}

if (platform.startsWith("osx")) {
    const frameworkDir = path.join(tmpDir, `nwjs-v${version}-${platform}`, 'nwjs.app');
    await fs.promises.cp(frameworkDir, path.join(buildDir, 'nwjs.app'), { recursive: true });
}

await fs.promises.rm(tmpDir, { recursive: true, force: true });

const appDir = path.join(buildDir, 'nwjs.app/Contents/Resources/app.nw');
for (const file of files) {
    await fs.promises.cp(file, path.join(appDir, file), { recursive: true });
}

const aa = path.join(buildDir, 'nwjs.app/Contents/Frameworks/nwjs Framework.framework/Versions');
const libffmpeg = findFilesSync(aa, 'libffmpeg.dylib');
if (libffmpeg) {
    await fs.promises.cp('./bin/darwin/libffmpeg.dylib', libffmpeg);
}

async function download(url, file) {
    console.log('Download framework from: ' + url);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Download failed: HTTP ${response.status}`);
    if (!response.body) throw new Error('Download failed: Response has no body');

    const total = Number(response.headers.get('content-length')) || 0;
    let downloaded = 0;

    const progressStream = new stream.Transform({
        transform(chunk, encoding, callback) {
            downloaded += chunk.length;
            if (downloaded < total) {
                const percent = (downloaded / total * 100).toFixed(2);
                process.stdout.write(`\rDownloaded: ${downloaded}/${total} bytes (${percent}%)`);
            } else {
                console.log(`\rDownload completed: ./${file}`);
            }
            callback(null, chunk);
        }
    });

    const readableStream = stream.Readable.fromWeb(response.body);
    const writableStream = fs.createWriteStream(file);
    await stream.promises.pipeline(readableStream, progressStream, writableStream);
}

function findFilesSync(dir, fileName) {
    const files = fs.readdirSync(dir); // 读取目录
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            const result = findFilesSync(fullPath, fileName);
            if (result) return result;
        } else if (file === fileName) {
            return fullPath;
        }
    }
    return null;
}

async function mkdirs(path) {
    await fs.promises.mkdir(path, { recursive: true });
}

function joinUrl(...parts) {
    const origin = parts.shift();
    return origin.replace(/\/+$/, '') + "/" + path.posix.join(...parts);
}