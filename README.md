# 表情包展示站（Meme Site）

一个**分类浏览斗图表情包**的多端站点，基于 React Native Web (Expo) 构建，一套代码同时运行在 **PC 浏览器 / H5 / 移动端 App**。

## ✨ 功能特性

- 🏷️ **分类浏览**：首页顶部分类横滑条 + 瀑布流无限滚动，自适应手机 2 列 / 平板 4 列 / 桌面 6 列
- 🔍 **搜索**：关键词匹配标题 / 描述 / 情绪 / 标签，详情页点标签可跳转搜索
- ❤️ **收藏**：本地持久化（AsyncStorage），进入收藏页自动刷新
- ⬇️ **下载 / 保存**：Web 端触发浏览器下载，移动端调起系统分享
- 📤 **用户上传**：选图 + 标题 / 分类 / 标签表单，服务端自动生成缩略图

## 🏗️ 技术架构

```
meme/
├── app/        # Expo 前端（React Native Web + Expo Router）
├── server/     # Node API（Express + SQLite + sharp）
├── scripts/    # 数据采集脚本
│   └── seed/   # download-capoo.ts（已废弃的咖波数据源）、import-doutu.ts（斗图表情导入）
└── package.json # npm workspaces 根配置
```

### 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Expo SDK 57 · React Native Web · Expo Router · TypeScript |
| 数据请求 | @tanstack/react-query |
| 跨端存储 | @react-native-async-storage/async-storage |
| 图标 | @expo/vector-icons (Ionicons) |
| 图片 | expo-image（GIF/PNG 高性能渲染） |
| 后端 | Node.js · Express · `node:sqlite`（内置模块，无需编译） |
| 图片处理 | sharp（上传缩略图） |
| 上传 | multer（multipart） |

> **注意**：数据库使用 Node 内置的 `node:sqlite`（`DatabaseSync`），不依赖 `better-sqlite3`，在 Windows 上无需任何编译环境。

## 🚀 快速开始

### 环境要求

- Node.js **22.5+**（需支持 `node:sqlite`，推荐 24+）
- npm

### 1. 安装依赖

```bash
npm install
```

> Windows 下如遇 sharp/esbuild 的安装脚本提示，运行 `npm approve-scripts sharp esbuild` 授权后重新 `npm install`。

### 2. 准备数据

首次运行需导入斗图表情数据：

```bash
# 方式一：从本机已下载的图片目录导入（推荐，最快）
npx tsx scripts/seed/import-doutu.ts
```

`import-doutu.ts` 默认从 `.tmp/expr-clone/img/` 读取图片（需先用稀疏检出下载，详见下方「扩充数据」）。

### 3. 启动

**终端 1 —— 后端 API**（端口 4000）：

```bash
npm run dev:server
```

**终端 2 —— 前端 Web**（端口 8081）：

```bash
npm run web
```

浏览器访问 http://localhost:8081

**移动端 App**：在 app 目录运行 `npm start`，用 **Expo Go** 扫码预览（Windows 无法运行 iOS 模拟器，Android/Expo Go 可测）。

## 📚 API 文档

服务地址：`http://localhost:4000`

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/health` | 健康检查 |
| GET | `/api/categories` | 分类列表（含数量与封面） |
| GET | `/api/memes?category=&query=&tag=&page=&pageSize=` | 分页浏览 / 搜索 |
| GET | `/api/memes/:id` | 表情包详情 |
| GET | `/api/memes/random` | 随机推荐一个 |
| POST | `/api/upload` | 上传表情包（multipart：file + title + category + tags） |
| GET | `/files/:path` | 静态图片访问（原图 + 缩略图） |

### 数据库 Schema

- **categories**：`id, name, slug, cover_id`
- **memes**：`id, title, description, tags, category_id, emotion, action, scene, file_path, thumb_path, file_type, width, height, size, source, created_at`
- **收藏**：仅存客户端本地（AsyncStorage），不建服务端表

数据库文件：`server/data/meme.db`（自动创建）

## 📦 构建与部署

```bash
# 构建 Web 静态站点 → app/dist/
npm run build

# 构建 Android / iOS JS bundle
npm run build:android
npm run build:ios
```

Web 构建产物在 `app/dist/`（Expo Router 静态渲染，生成各路由 HTML）。部署时用静态服务器托管 `dist/`，后端 API 需保持运行。

## 🎨 页面结构

| 路由 | 页面 |
|---|---|
| `/` | 首页：分类横滑条 + 瀑布流 |
| `/search` | 搜索页：关键词 + 标签 |
| `/favorites` | 收藏页：本地收藏列表 |
| `/upload` | 上传页：选图 + 表单 |
| `/meme/:id` | 详情页：大图 / 标签 / 收藏 / 下载 |

## 🗂️ 数据说明与版权

- **当前数据**：3000 张中文斗图表情，来源于开源仓库 [atanet90/expression-pack](https://github.com/atanet90/expression-pack)，**CC0-1.0 公有领域许可**，可自由使用 / 商用 / 分发。
- 这些图片源自发表情网（fabiaoqing.com）的公开斗图表情，无标题 / 标签等语义标注，搜索仅能匹配编号标题。
- 用户上传的内容存储在 `server/uploads/`（已加入 `.gitignore`），第一阶段无鉴权、落本地磁盘，适合自用 / 内网。

## 📈 扩充数据

### 扩充斗图表情数量

```bash
# 1. 稀疏检出（首次）更多图片到 .tmp/expr-clone/
cd .tmp
git clone --depth 1 --filter=blob:none --sparse https://github.com/atanet90/expression-pack.git expr-clone
cd expr-clone
# 将需要检出的文件路径写入 .git/info/sparse-checkout（每行一个，如 img/0.jpg）
git checkout

# 2. 重新导入（MAX 控制数量）
MAX=5000 npx tsx scripts/seed/import-doutu.ts
```

`import-doutu.ts` 是幂等的：已存在的文件会跳过（DB 去重）。

### 接入新数据源

新增 seed 脚本写入 `memes` / `categories` 表即可，参考 `scripts/seed/import-doutu.ts` 的实现。

## ⚠️ 已知限制

- **搜索受限**：当前数据无语义标注，搜索只能按"斗图表情 N"编号标题匹配；如需按"熊猫头 / 金馆长"等主题搜索，需接入带标题分类的数据源（如斗图啦，但爬取商业站有版权风险）。
- **上传无鉴权**：适合自用 / 内网，公网部署需加鉴权和对象存储。
- **单角色 vs 多样化**：早期曾使用单一 IP（咖波）数据，已替换为多样化斗图集合。

## 🛠️ 常用命令速查

| 命令 | 作用 |
|---|---|
| `npm run dev:server` | 启动后端 API（热重载） |
| `npm run web` | 启动前端 Web（开发模式） |
| `npm run build` | 构建 Web 静态产物 |
| `npm run build:android` / `build:ios` | 导出原生 JS bundle |
| `npm install` | 安装全部 workspace 依赖 |
| `npx tsx scripts/seed/import-doutu.ts` | 导入斗图表情数据 |
