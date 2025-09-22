# 项目结构说明

## 目录概览

```
app01/
├── LICENSE                  # MIT 授权文件
├── README.md                # 项目说明与使用文档
├── package.json             # npm 配置与 electron-builder 设置
├── index.html               # Web 入口页面
├── style.css                # 样式文件
├── script.js                # 浏览器端主逻辑
├── qrcode.min.js            # 默认引入的 QRCode 生成库
├── qrcode-standalone.js     # 离线备用的 QRCode 实现（见下文说明）
├── manifest.json            # PWA manifest
├── sw.js                    # Service Worker 缓存逻辑
├── electron/                # Electron 桌面应用相关文件
│   ├── main.js              # 主进程入口
│   ├── preload.js           # 预加载脚本
│   ├── icon.icns            # 应用图标
│   └── (桌面版说明已合并至根目录 README)
├── dist/                    # electron-builder 输出目录（已在 .gitignore 中忽略）
├── node_modules/            # 项目依赖（已在 .gitignore 中忽略）
└── PROJECT_STRUCTURE.md     # 本文件
```

## 关键文件说明

### Web 端
- `index.html`：包含页面结构与资源引用。
- `style.css`：定义主题色、响应式布局及交互样式。
- `script.js`：封装在 `QRCodeGenerator` 类中的核心交互逻辑，负责 URL 校验、二维码生成、导出与历史记录。
- `qrcode.min.js`：主流程使用的第三方 QRCode 库。若需要在完全离线的环境使用，可改为在 `index.html` 中引入 `qrcode-standalone.js`。

### 桌面端（Electron）
- `electron/main.js`：创建浏览器窗口并加载本地 HTML 文件。
- `electron/preload.js`：预留与渲染进程通信的桥梁，当前仅做占位。
- `electron/icon.icns`：macOS 应用图标，可按需替换。
- 桌面版开发与打包说明已迁移到根 README 的“桌面版（Electron）”章节。

### 配置与文档
- `package.json`：包含 npm 脚本、依赖以及 electron-builder 的打包配置。
- `.gitignore`：忽略构建产物、依赖以及系统/编辑器生成的文件。
- `README.md`：项目介绍、功能说明以及部署指引。
- `LICENSE`：MIT 协议文本，便于 GitHub 自动识别授权信息。

## 维护建议
- 保持 `README.md` 与 `PROJECT_STRUCTURE.md` 同步更新，确保仓库访客能够快速了解目录与使用方式。
- 发布 Release 前执行 `npm install && npm run build:mac`，将生成的 DMG 与对应版本标签一并上传。
- 若有自定义资源（如截图、文档），建议放入 `docs/` 或 `assets/` 子目录，以便管理。
