# Flawless-Cut

[English](README.md) | [简体中文](README_zh.md)

Flawless-Cut 的开发是为了改进另一款应用程序 [Lossless-Cut](https://github.com/mifi/lossless-cut) 的用户界面。该项目的
issue 中提到过新的 UI 方案，但一直未能升级。与 Lossless-Cut 相比，Flawless-Cut 删除了一些不常用的功能和用户偏好设置，使其保持简洁易用。尽管
Flawless-Cut 在代码层面几乎完全重写，但仍借鉴了 Lossless-Cut 的许多实现方式，特此致谢。

![Software Interface](https://raw.githubusercontent.com/metadream/flawless-cut/main/assets/screenshot.png)

## 主要功能

- 无损剪辑常见格式的视频/音频（非常快）
- 无损合并相同编码格式的视频/音频片段（非常快）
- 有损剪辑视频/音频并转换为MP4格式（快速）
- 有损剪辑或提取视频中的音频并转换为MP3格式（快速）
- 截取视频帧为体积最小、质量最高的图片
- 录制屏幕和麦克风输出
- 可视化音频波形
- 支持 Windows/Linux/MacOS 平台

## 快捷键

| 按键    | 动作
|--------| -------------
| 右方向键   | 前进一秒
| 左方向键   | 后退一秒
| 空格键    | 播放/暂停
| 反引号键   | 显示元数据

## 支持的格式

由于 Flawless-Cut 基于 Chromium 内核和 HTML5 视频播放器，并非所有 ffmpeg
支持的格式都能直接支持。为了更快、更流畅地使用此应用，通常建议导入以下格式/编码：MP4、MOV、WebM、MKV、OGG、WAV、MP3、AAC、H264、Theora、VP8、VP9。  
关于 Chromium 支持的格式/编码的更多信息，请参见 <https://www.chromium.org/audio-video>。

对于 Chromium 不支持的格式，Flawless-Cut 会使用快速实时转码和播放技术，让所有 ffmpeg
能解码的视频都可以播放，且剪辑结果仍然是无损的。但遗憾的是，尤其在大型视频文件的情况下，这种方式的效率（特别是拖动流畅度）仍无法与原生支持的格式相媲美。

## 开发与构建

### 1. 安装 NODE & NPM

请自行安装。

### 2. 安装依赖

```bash
npm install
```

如果在中国大陆遇到网络问题，请使用 ELECTRON 的镜像。

```
# Linux/MacOS
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"

# Windows CMD
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/

# Windows PowerShell
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"

# 也可能需要这个
npm config set strict-ssl false

# 然后再次尝试安装
npm install
```

### 3. 运行和调试

```
npm start
```

### 4. 按平台构建

```
npm run build:linux
npm run build:win
npm run build:mac
```

在Linux上，你可能还需要执行以下命令：

```bash
chmod +x bin/linux/*
sudo apt install -y libmediainfo-dev
```

## 附录

### Mediainfo & Ffmpeg 静态构建

- https://mediaarea.net/en/MediaInfo
- https://www.ffmpeg.org/download.html
  - Windows: https://github.com/BtbN/FFmpeg-Builds/releases
  - Linux: https://github.com/BtbN/FFmpeg-Builds/releases
  - MacOS: https://evermeet.cx/ffmpeg

### 将 PNG 转换为 ICNS
```
sips -s format icns icon.png --out icon.icns
```