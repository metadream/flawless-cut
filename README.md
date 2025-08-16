# Flawless-Cut

## TODO
- 启动报错
- 无法打开开发者工具（仅支持SDK方式？SDK在mac上无法打开）

Flawless-Cut was developed to improve the user interface of another
application, [Lossless-Cut](https://github.com/mifi/lossless-cut), a new plan for UI were mentioned in that project's
issue but never upgraded. Compared to Lossless-Cut, Flawless-Cut removes some infrequently used features and user
preferences to keep it simple and easy to use. Although Flawless-Cut is almost completely rewritten in terms of code, it
still borrows from many practices of Lossless-Cut, thanks for that.

![Software Interface](https://raw.githubusercontent.com/metadream/flawless-cut/master/assets/screenshot.png)

## Main Features

- Losslessly cut video/audio in common formats (fast)
- Losslessly merge video/audio clips of the same encoding format (fast)
- Lossy cut video/audio and convert to MP4 format (slow)
- Lossy cut or extract audio from video and convert to MP3 format (slow)
- Capture video frames as pictures with the smallest file and highest quality
- Record output of screen and microphone
- Visualization of audio sound waves
- Support for Windows/Linux platforms

## Shortcut Keys

Key         | Action
----------- | ------------------
Space       | Play/Pause
Right arrow | Forward one second
Left arrow  | Go back one second

## Supported Formats

Since Flawless-Cut is based on Chromium core and HTML5 video player, not all ffmpeg supported formats are supported
directly. In order to use this application faster and smoother, the following formats/codecs should generally be
imported: MP4, MOV, WebM, MKV, OGG, WAV, MP3, AAC, H264, Theora, VP8, VP9\. Related for more information on Chromium's
supported formats/codecs, see <https://www.chromium.org/audio-video。>

For formats not supported by Chromium, Flawless-Cut uses fast real-time transcoding and playback technology, which
allows play all videos which ffmpeg can be decoded, and the cut result is still lossless. But unfortunately, especially
in the case of large video files, the efficiency of this method (accurately in terms of tracking fluency) is still not
the same as the native support format.

## Develop and Build

### 1\. Install NODE & NPM

Please install it yourself.

### 2\. Install Dependencies

```
npm install -g nw
nw -v
```

由于H.264编解码器并非开源软件，因此在播放此类视频时需要作额外设置，否则可能无法输出声音。首先从社区获取预编译的二进制文件，并覆盖系统中对应文件，路径、文件名因平台而异。
https://github.com/nwjs-ffmpeg-prebuilt/nwjs-ffmpeg-prebuilt/releases
- Windows: `ffmpeg.dll`
- MacOS: `nwjs.app/Contents/Frameworks/nwjs Framework.framework/Versions/<chromium-version>/libffmpeg.dylib`
- Linux: `lib/libffmpeg.so`

console无法输出到终端，需要在启动命令行中增加参数：
`nw --enable-logging=stderr .`

### 3\. Run and Debug

```
npm start
```

If you have problems when opening video files, try the following commands:

```
chmod +x app/bin/*
sudo apt install -y libmediainfo-dev
```

### 4\. Build by Platform

```
npm run build
```