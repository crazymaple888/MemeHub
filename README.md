# MemeHub · 斗图表情包多端展示站

一套代码同时运行在 **PC 浏览器 / H5 / 移动端 App** 的斗图表情包站，基于 React Native Web (Expo) 构建。数据只存图片链接、前端直接热链外部图源，不占本地存储。采用**暗色霓虹画廊**视觉风格。

## ✨ 功能特性

- 🏷️ **分类浏览**：首页顶部分类横滑条 + 瀑布流无限滚动，自适应手机 2 列 / 平板 4 列 / 桌面 6 列
- 🔍 **搜索**：关键词匹配标题 / 描述 / 标签，详情页点标签可一键跳转搜索
- ❤️ **收藏**：本地持久化（AsyncStorage），进入收藏页自动刷新
- ⬇️ **下载 / 保存**：Web 端触发浏览器下载，移动端调起系统分享
- 👤 **用户系统**：用户名 + 密码注册登录，上传权限需管理员审核
- 📤 **上传审核**：新用户注册后为"待审核"，管理员批准后才可上传
- 🔗 **热链架构**：爬取数据只存图片 URL，前端直接显示外部图源，零本地存储
- 🎨 **暗色霓虹画廊**：深墨黑背景 + 电光紫/青蓝渐变，彩色表情包成为视觉主角

## 🏗️ 目录结构

```
MemeHub/
├── app/          # Expo 前端（多端应用）
├── server/       # Node 后端 API（数据服务 + 用户/审核）
├── scripts/      # 数据采集脚本（爬虫）
├── .github/      # GitHub Actions 部署工作流
└── package.json  # npm workspaces 根配置（统一命令入口）
```

> 项目使用 **npm workspaces** 管理 `app` 与 `server` 两个子包，根目录命令可统一调度。

---

## 📱 `app/` — 前端（Expo 多端应用）

基于 **Expo SDK 57 + React Native Web**，一套代码输出 PC 浏览器 / H5 / 移动端 App。

### 技术栈

| 类别 | 技术 |
|---|---|
| 框架 | Expo SDK 57 · React Native Web · Expo Router · TypeScript |
| 路由 | Expo Router（`src/app/` 文件即路由） |
| 数据请求 | @tanstack/react-query |
| 跨端存储 | @react-native-async-storage/async-storage（收藏 / 登录 token / 管理员密钥） |
| 图标 | @expo/vector-icons (Ionicons) |
| 图片 | expo-image（GIF/PNG 高性能渲染 + 热链） |
| 渐变 | expo-linear-gradient |
| 代码检查 | ESLint 9 + eslint-config-expo |

### 目录结构

```
app/
├── src/
│   ├── app/               # Expo Router 路由（文件即页面）
│   │   ├── _layout.tsx    # 根布局：QueryClient + SafeArea + Stack
│   │   ├── (tabs)/        # 底部 Tab 导航组
│   │   │   ├── _layout.tsx    # Tab 配置（浏览/搜索/收藏/我的）
│   │   │   ├── index.tsx      # 首页：分类横滑条 + 瀑布流
│   │   │   ├── search.tsx     # 搜索页
│   │   │   ├── favorites.tsx  # 收藏页
│   │   │   └── me.tsx         # 《我的》：登录/注册/权限状态/功能入口
│   │   ├── meme/[id].tsx      # 详情页
│   │   ├── upload.tsx         # 发布表情包（独立页，从《我的》进入）
│   │   └── review.tsx         # 管理员审核页（从《我的》进入）
│   ├── components/        # 复用组件
│   │   ├── MemeCard.tsx       # 表情包卡片
│   │   ├── MemeGrid.tsx       # 响应式瀑布流网格
│   │   └── UploadForm.tsx     # 上传表单
│   ├── hooks/             # 自定义 hooks
│   │   └── use-paginated-memes.ts  # 分页 + 无限滚动
│   ├── lib/               # 工具库
│   │   ├── api.ts             # API client（token/密钥自动注入）
│   │   ├── auth.ts            # 登录 token / 管理员密钥存储
│   │   ├── types.ts           # 类型 + 图片 URL 构造
│   │   ├── favorites.ts       # 收藏（AsyncStorage）
│   │   └── download.ts        # 跨端下载/保存
│   ├── constants/         # 主题常量（霓虹设计令牌）
│   └── global.css         # 全局样式（CSS 变量 + 深色）
├── assets/                # 静态资源（图标/启动图）
├── app.json               # Expo 配置
├── eslint.config.js       # ESLint 配置
└── tsconfig.json          # TypeScript 配置
```

### 页面路由

| 路由 | 页面 |
|---|---|
| `/` | 首页：分类横滑条 + 瀑布流 |
| `/search` | 搜索页：关键词 + 标签 |
| `/favorites` | 收藏页：本地收藏列表 |
| `/me` | 《我的》：登录/注册/权限状态/功能入口 |
| `/upload` | 发布表情包（需已批准上传权限） |
| `/review` | 管理员审核页（需管理员密钥） |
| `/meme/:id` | 详情页：大图 / 标签 / 收藏 / 下载 |

### 常用命令（在 `app/` 下运行）

```bash
npm start             # 启动 Expo（可扫码预览 App）
npm run web           # 启动 Web 开发模式（端口 8081）
npm run android       # 启动 Android
npm run ios           # 启动 iOS（需 macOS）
npm run build         # 构建 Web 静态产物 → app/dist/
npm run build:android # 导出 Android JS bundle
npm run build:ios     # 导出 iOS JS bundle
npm run lint          # ESLint 检查
```

---

## 🖥️ `server/` — 后端 API（数据服务 + 用户/审核）

基于 **Node.js + Express + SQLite**，提供表情包数据、用户认证与上传权限审核。

### 技术栈

| 类别 | 技术 |
|---|---|
| 运行时 | Node.js（推荐 22.5+，需支持内置 `node:sqlite`） |
| 框架 | Express |
| 数据库 | `node:sqlite`（`DatabaseSync`，**内置模块无需编译**） |
| 密码哈希 | `crypto.scrypt`（内置，无额外依赖） |
| 图片处理 | sharp（上传生成缩略图） |
| 上传 | multer（multipart 解析） |
| 跨域 | cors |

> **为什么用 `node:sqlite`**：Node 内置的 SQLite 模块，API 兼容 better-sqlite3，在 Windows 上无需任何编译环境（避免 native 编译问题）。

### 目录结构

```
server/
├── src/
│   ├── index.ts          # 入口：Express 应用 + 路由挂载 + 静态文件
│   ├── db.ts             # SQLite 连接 + 建表 + 迁移
│   ├── types.ts          # 共享类型定义
│   └── routes/           # 路由
│       ├── memes.ts          # 表情包列表/搜索/详情/随机
│       ├── categories.ts     # 分类列表
│       ├── auth.ts           # 注册/登录/当前用户 + 密码哈希
│       ├── admin.ts          # 审核列表/批准/拒绝（管理员密钥）
│       └── upload.ts         # 上传接口（需已批准权限）
├── data/                 # SQLite 数据库文件（自动创建，gitignore）
├── uploads/              # 用户上传的图片（gitignore）
├── package.json
└── tsconfig.json
```

### 用户与权限体系

```
注册(用户名+密码) → status=pending(待审)
  → 管理员在审核页批准 → status=approved → 可上传
  → 管理员拒绝 → status=rejected → 不可上传
```

- **密码**：`crypto.scrypt` 加盐哈希存储，无明文
- **会话**：注册/登录返回随机 token，前端存 AsyncStorage，请求带 `Authorization: Bearer <token>`
- **管理员**：审核接口需 `X-Admin-Key` 头，密钥为环境变量 `ADMIN_KEY`（默认 `memeadmin`）
- **上传鉴权**：`POST /api/upload` 需登录且 status 为 `approved`，否则返回 401/403

### API 接口

服务地址：`http://localhost:4000`

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/api/health` | 无 | 健康检查 |
| GET | `/api/categories` | 无 | 分类列表（含数量与封面） |
| GET | `/api/memes?category=&query=&tag=&page=&pageSize=` | 无 | 分页浏览 / 搜索 |
| GET | `/api/memes/:id` | 无 | 表情包详情 |
| GET | `/api/memes/random` | 无 | 随机推荐一个 |
| POST | `/api/auth/register` | 无 | 注册（默认 pending） |
| POST | `/api/auth/login` | 无 | 登录，返回 token + status |
| GET | `/api/auth/me` | Bearer token | 当前用户信息 |
| GET | `/api/admin/requests` | X-Admin-Key | 待审用户列表 |
| GET | `/api/admin/users` | X-Admin-Key | 全部用户列表 |
| POST | `/api/admin/approve/:id` | X-Admin-Key | 批准上传权限 |
| POST | `/api/admin/reject/:id` | X-Admin-Key | 拒绝上传权限 |
| POST | `/api/upload` | token + approved | 上传表情包（multipart） |
| GET | `/files/:path` | 无 | 静态图片访问（本地上传） |

### 数据库 Schema

数据库文件：`server/data/meme.db`（自动创建）

- **categories**：`id, name, slug, cover_id`
- **memes**：`id, title, description, tags, category_id, emotion, action, scene, file_path, thumb_path, image_url, file_type, width, height, size, source, user_id, created_at`
- **users**：`id, username(UNIQUE), password_hash, status('pending'|'approved'|'rejected'), token, created_at`
- **收藏**：仅存客户端本地（AsyncStorage），不建服务端表

**图片双来源**：

| 来源 | 存储方式 | DB 字段 |
|---|---|---|
| 爬取的表情包 | 只存外部 URL，不落盘 | `image_url`（`file_path` 为 NULL） |
| 用户上传 | 落盘 `uploads/` + 缩略图 | `file_path` / `thumb_path`（`image_url` 为 NULL） |

前端图片 URL 优先级：`image_url`（热链）> `/files/{file_path}`（本地）。

### 常用命令（在 `server/` 下运行）

```bash
npm run dev       # 启动开发模式（tsx watch 热重载）
npm run start     # 启动生产模式
npm run build     # tsc 编译
npm run typecheck # 类型检查
```

---

## 🕷️ `scripts/` — 数据采集脚本

存放表情包数据采集脚本，**不参与运行时**，按需手动或定时执行。

### 目录结构

```
scripts/
└── seed/
    └── scrape-doutu.ts   # 爬取斗图啦(doutupk)表情 URL
```

### scrape-doutu.ts 说明

| 项目 | 说明 |
|---|---|
| 数据源 | 斗图啦（doutupk.com）中文斗图表情 |
| 工作方式 | 遍历文章分页 → 详情页提取图片 URL + 标题 → 写入 DB |
| 存储 | **只存图片 URL（`image_url`），不下载图片文件** |
| 幂等 | 已存在的 `image_url` 自动跳过，可重复运行增量补充 |

### 运行方式

```bash
# 通过根目录命令（推荐）
npm run seed

# 直接运行，可自定义数量（默认 30 页 / 500 条）
MAX_PAGES=100 MAX_TOTAL=2000 npx tsx scripts/seed/scrape-doutu.ts
```

**接入新数据源**：新增脚本写入 `memes` / `categories` 表即可——爬取的图片只填 `image_url`（不填 `file_path`），参考 `scrape-doutu.ts` 的实现。

---

## ⚙️ 根目录配置

### npm workspaces

根 `package.json` 通过 workspaces 统一管理 `app` / `server` 两个子包，提供跨包命令入口：

```bash
npm install          # 安装全部子包依赖
npm run dev:server   # 启动后端 API（端口 4000）
npm run web          # 启动前端 Web（端口 8081）
npm run build        # 构建前端 Web 静态产物
npm run build:android / build:ios   # 导出原生 JS bundle
npm run seed         # 运行爬虫采集数据
```

### 环境变量

| 变量 | 用途 | 默认值 |
|---|---|---|
| `ADMIN_KEY` | 管理员审核密钥 | `memeadmin` |
| `PORT` | 后端端口 | `4000` |
| `EXPO_PUBLIC_API_URL` | 前端请求的后端地址 | `http://localhost:4000` |

### 自动化部署

`.github/workflows/deploy.yml`（GitHub Actions）：
- **推代码到 `main`**：自动构建前端 → 部署到服务器 → 重启后端 → 增量爬取数据
- **每天北京时间 03:00**：自动增量爬取新斗图表情
- **手动触发**：可选择"仅更新数据"

---

## 🚀 快速开始

### 环境要求

- Node.js **22.5+**（需支持 `node:sqlite`，推荐 24+）
- npm

### 1. 安装依赖

```bash
npm install
```

> Windows 下如遇 sharp / esbuild 的安装脚本提示，运行 `npm approve-scripts sharp esbuild` 授权后重新 `npm install`。

### 2. 准备数据（爬取表情包）

```bash
npm run seed
```

### 3. 启动

**终端 1 —— 后端 API**（端口 4000）：

```bash
npm run dev:server
```

**终端 2 —— 前端 Web**（端口 8081）：

```bash
npm run web
```

浏览器访问 **http://localhost:8081**

**移动端 App**：在 `app/` 目录运行 `npm start`，用 **Expo Go** 扫码预览（Windows 无法运行 iOS 模拟器，Android / Expo Go 可测）。

### 4. 开通上传权限

1. 在《我的》页注册账号 → 状态为"待审核"
2. 在《我的》页点"管理员审核入口"，输入密钥（默认 `memeadmin`）→ 验证
3. 在审核列表中点"批准"该用户
4. 回到《我的》页 → 状态变为"已开通上传" → 可进入"发布表情包"

---

## 📦 构建与部署

```bash
# 构建 Web 静态站点 → app/dist/
npm run build

# 构建 Android / iOS JS bundle
npm run build:android
npm run build:ios
```

Web 构建产物在 `app/dist/`（Expo Router 静态渲染，生成各路由 HTML）。部署时用静态服务器托管 `dist/`，后端 API 需保持运行。

---

## 🗂️ 数据说明与版权

- **当前数据**：从斗图啦（doutupk.com）爬取的 500+ 张中文斗图表情（熊猫头 / 蘑菇头 / 金馆长风格），**只存图片 URL（`image_url`），不存本地文件**，前端直接热链外部图源 `img.doutupk.com`。
- **热链风险**：图片托管在斗图啦服务器，存在失效 / 防盗链 / 站点改版风险，数据可访问性依赖对方。
- **标题语义**：标题来自斗图啦文章标题（含 `#话题标签#`），搜索基于标题 / 描述 / 标签。
- **用户上传**：存本地 `server/uploads/`（已加入 `.gitignore`），`file_path` + sharp 缩略图，上传者记录在 `user_id`。

---

## ⚠️ 已知限制

- **热链依赖外部站点**：斗图啦是商业站，图片 URL 可能失效、限流或防盗链。
- **搜索基于标题**：无标题或标题不完整的表情较难搜到。
- **管理员密钥固定**：默认 `memeadmin`，需通过环境变量 `ADMIN_KEY` 修改；无多管理员体系。
- **历史遗留**：早期版本曾下载到本地（CC0 数据源 / 单一 IP 表情），已迁移为热链架构。

---

## 🛠️ 常用命令速查

| 命令 | 作用 | 所属 |
|---|---|---|
| `npm run dev:server` | 启动后端 API（热重载） | 根 |
| `npm run web` | 启动前端 Web（开发模式） | 根 |
| `npm run build` | 构建 Web 静态产物 | 根 |
| `npm run build:android` / `build:ios` | 导出原生 JS bundle | 根 |
| `npm run seed` | 爬取斗图表情数据（只存 URL） | 根 |
| `npm install` | 安装全部 workspace 依赖 | 根 |
| `npm start` | 启动 Expo（App 预览） | app |
| `npm run lint` | ESLint 检查 | app |
| `npm run dev` / `start` | 后端开发 / 生产模式 | server |
| `npm run typecheck` | 后端类型检查 | server |
