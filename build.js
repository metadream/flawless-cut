import packageJson from './package.json' with { type: 'json' };
import path from "node:path";
import fs from "node:fs";
import stream from 'node:stream';
import compressing from 'compressing';

// 0. Create tmp directory
const tmpDir = './tmp';
await mkdirs(tmpDir);

const { mirror, version, platform, arch, buildDir, files } = getBuildConfig();
const nwDirName = `nwjs-v${version}-${platform}-${arch}`;
const zipFormat = platform === 'linux' ? "tar.gz" : "zip";
const zipFileName = `${nwDirName}.${zipFormat}`
const nwUrl = joinUrl(mirror, "v" + version, zipFileName);
const nwFile = path.join(tmpDir, zipFileName);

// 1. Download normal release version of NW.js
await download(nwUrl, nwFile);

// 2. Decompress archived file
zipFormat === 'tar.gz'
    ? await compressing.tgz.uncompress(nwFile, tmpDir)
    : await compressing.zip.uncompress(nwFile, tmpDir);
console.log('Decompress completed.');

// 3. Copy MW.js framework to build directory
await copyFramework(platform);
await fs.promises.rm(tmpDir, { recursive: true, force: true });
console.log('Copy framework completed.');

// 4. Build app.nw package
await buildPackage(platform);
console.log('Packaging completed.');

// 5. Replace libffmpeg with prebuild version
await replaceLibFfmpeg(platform);
console.log('Replace libffmpeg completed.');

// 6. Update app icon
console.log('Update app icon completed.');

// 7. Update app settings
console.log('Update app settings completed.');
console.log('Build completed: ', buildDir);

async function replaceLibFfmpeg(platform) {
    let prebuildFile, searchScope;
    if (platform === "osx") {
        prebuildFile = path.join(buildDir, platform, 'nwjs.app/Contents/Resources/app.nw/bin/darwin/libffmpeg.dylib');
        searchScope = path.join(buildDir, platform, 'nwjs.app/Contents/Frameworks/nwjs Framework.framework/Versions');
    } else if (platform === 'linux') {

    } else if (platform === 'win') {

    } else {
        throw new Error('Unknown platform');
    }

    // Find the path of libffmpeg and replace with prebuild version
    const libffmpegFile = findFilesSync(searchScope, 'libffmpeg.dylib');
    if (libffmpegFile) {
        await fs.promises.rename(prebuildFile, libffmpegFile);
    }
}

async function buildPackage(platform) {
    let appPackage, binDir;
    if (platform === "osx") {
        appPackage = path.join(buildDir, platform, 'nwjs.app/Contents/Resources/app.nw');
        binDir = './bin/darwin';
    } else if (platform === 'linux') {

    } else if (platform === 'win') {

    } else {
        throw new Error('Unknown platform');
    }

    // Copy src files to app package
    for (const file of files) {
        await fs.promises.cp(file, path.join(appPackage, file), { recursive: true });
    }
    // Copy executable tool to app package
    await fs.promises.cp(binDir, path.join(appPackage, binDir), { recursive: true });
}

async function copyFramework(platform) {
    let nwDir, appDir;
    if (platform === "osx") {
        nwDir = path.join(tmpDir, nwDirName, 'nwjs.app');
        appDir = path.join(buildDir, platform, 'nwjs.app');
    } else if (platform === 'linux') {

    } else if (platform === 'win') {

    } else {
        throw new Error('Unknown platform');
    }
    await fs.promises.cp(nwDir, appDir, { recursive: true });
}

function getBuildConfig() {
    const config = Object.assign({
        "mirror": "https://dl.nwjs.io",
        "version": null,
        "platform": null,
        "arch": null,
        "buildDir": "./dist",
        "files": []
    }, packageJson.build);

    if (!config.version) throw new Error("NW.js version unspecified");
    if (!config.platform) throw new Error("NW.js platform unspecified");
    if (!config.arch) throw new Error("NW.js arch unspecified");
    if (!config.files.length) throw new Error("NW.js app files unspecified");
    return config;
}

async function download(url, file) {
    console.log('Download from: ' + url);
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