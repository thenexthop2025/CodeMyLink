# CodeMyLink

一个简单易用的链接转 QR 工具，让任何 URL 秒变高质量二维码。

[项目仓库](https://github.com/thenexthop2025/CodeMyLink) · [最新版发布](https://github.com/thenexthop2025/CodeMyLink/releases)

![CodeMyLink 截图](docs/mainview.png)

## 下载与安装

### macOS
1. 前往 [Releases](https://github.com/thenexthop2025/CodeMyLink/releases) 下载 `CodeMyLink-*.dmg`。
2. 双击 DMG，将 `CodeMyLink.app` 拖入 `Applications`。
3. 首次启动若提示“来自未识别开发者”，在 *系统设置 → 隐私与安全性* 中允许运行即可。

### Windows
1. 在 [Releases](https://github.com/thenexthop2025/CodeMyLink/releases) 下载 `CodeMyLink-*-x64.exe`。
2. 双击安装包并按照向导完成安装。
3. 如遇 SmartScreen 提示“未知发布者”，选择 *More info → Run anyway*。

## 功能亮点

- 🔗 自动校验输入 URL，避免生成无效二维码
- 🧾 一键生成高分辨率二维码，可自定义颜色与容错等级
- 💾 支持导出 PNG、SVG，方便嵌入海报或文档
- 📋 内置复制与历史记录，快速复用常用链接
- 🖥️ 原生 Electron 桌面体验，离线也能使用

## 快速体验（源码）

```bash
git clone https://github.com/thenexthop2025/CodeMyLink.git
cd CodeMyLink
npm install
npm run desktop     # 启动本地静态服务 + Electron 窗口
```

## 从源码构建

```bash
# 打包 macOS DMG
npm run build:mac

# 打包 Windows x64 安装包（需 Wine/NSIS 环境）
npm run build:win
```
打包产物输出到 `dist/`，其中图标文件位于 `electron/icon.icns`（mac）和 `electron/icon.ico`（win）。

## 主要目录

```
CodeMyLink/
├── electron/          # Electron 主进程、图标等
├── index.html         # Web 入口页
├── script.js          # 业务逻辑
├── style.css          # UI 样式
├── docs/              # 项目截图等文档资源
└── package.json       # npm 脚本与打包配置
```

## 许可证

本项目基于 [MIT License](LICENSE) 分享，欢迎二次开发与改进。

## 贡献

欢迎通过 Issues / Pull Requests 反馈需求与提交改进。
