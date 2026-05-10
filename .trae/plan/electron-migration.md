# Electron 桌面应用迁移计划

## 一、现状分析

### 1.1 当前技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 框架 | React 18 + TypeScript | UI 渲染层 |
| 构建 | Vite 5 | 开发/构建 |
| UI 库 | Ant Design 5 + @ant-design/icons | 组件与图标 |
| 样式 | 内联样式 + index.css | 无 CSS 模块化 |
| 数据 | JSON 静态文件 (pokemon/skills/buffs) | import 导入 |

### 1.2 当前项目结构

```
website/
├── index.html              # HTML 入口
├── package.json            # 依赖和脚本
├── tsconfig.json           # TS 配置
├── tsconfig.node.json      # Vite 专用 TS 配置
├── vite-env.d.ts           # 类型声明
├── vite.config.ts          # Vite 配置
└── src/
    ├── main.tsx            # React 入口
    ├── App.tsx             # 根组件 (~120 行)
    ├── index.css           # 全局样式
    ├── components/         # 8 个组件
    ├── hooks/              # useRounds
    ├── utils/              # buff, pet, export
    ├── constants/          # 公共常量
    ├── types/              # TypeScript 类型
    └── config/             # JSON 数据
```

### 1.3 当前功能清单

1. 双方玩家阵容选择（最多6只精灵）
2. 多回合逐回合操作记录
3. 场上精灵 HP/能量状态调节
4. 增益减益（5项属性）数值调整
5. 行动选择（使用技能 / 更换精灵）
6. JSON 数据导出
7. 回合导航（上一回合/下一回合/添加/删除）

---

## 二、目标架构

### 2.1 Electron 进程模型

```
┌─────────────────────────────────────────────┐
│              Electron Application            │
│                                             │
│  ┌──────────────┐     IPC     ┌───────────┐ │
│  │ Main Process  │◄──────────►│ Renderer  │ │
│  │ (Node.js)     │  preload   │ (React)   │ │
│  │               │  bridge    │           │ │
│  │ - 窗口管理    │            │ - 现有 UI │ │
│  │ - 菜单系统    │            │ - 所有功能│ │
│  │ - 系统托盘    │            │           │ │
│  │ - 原生对话框 │            │           │ │
│  │ - 文件IO     │            │           │ │
│  └──────────────┘            └───────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

### 2.2 技术选型

| 组件 | 技术 | 理由 |
|------|------|------|
| Electron 框架 | `electron` ^33 | 最新稳定版 |
| 主进程 TypeScript | `electron-vite` | 零配置管理 main/preload/renderer 三个进程的 TypeScript 编译和 Vite HMR |
| 打包工具 | `electron-builder` | 支持 NSIS(Windows) / DMG(macOS)，社区最成熟 |
| 热重载 | `electron-vite` 内置 | 开发时 main/preload/renderer 均支持 HMR |

> **选型说明**：采用 `electron-vite` 而非手动集成 `vite-plugin-electron`，原因：
> - `electron-vite` 提供统一的主进程/preload/渲染进程 Vite 配置，开箱即用
> - 内置 dev 环境自动启动 Electron + HMR
> - 内置 build 流程，生成 dist 产物直接对接 electron-builder
> - 社区更活跃，文档更完善

### 2.3 迁移后项目结构

```
website/
├── package.json            # 更新：添加 electron 依赖和脚本
├── electron.vite.config.ts # 新增：electron-vite 统一配置（替代原 vite.config.ts）
├── electron-builder.yml    # 新增：打包配置
├── tsconfig.json           # 调整：适配 electron 路径
├── tsconfig.node.json      # 调整：包含 electron 目录
├── tsconfig.web.json       # 新增：src 渲染进程 TS 配置
├── electron/               # 新增：主进程与预加载
│   ├── main.ts             #   主进程入口（窗口、菜单、托盘、IPC）
│   ├── preload.ts          #   预加载脚本（contextBridge）
│   └── menu.ts             #   原生菜单定义
├── resources/              # 新增：应用图标等静态资源
│   └── icon.png            #   应用图标（后续 generate 自动生成各平台尺寸）
├── src/                    # 保持不变：现有 React 渲染进程代码
│   ├── main.tsx            #   React 入口（基本不变）
│   ├── App.tsx             #   根组件（可能需要少量适配）
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   ├── constants/
│   ├── types/
│   └── config/
└── index.html              # 基本不变（src 路径可能微调）
```

---

## 三、执行步骤

### 步骤 1：安装 Electron 依赖

卸载旧构建依赖，安装新依赖：

```bash
npm uninstall vite @vitejs/plugin-react
npm install --save-dev electron electron-vite electron-builder
npm install --save-dev @types/node
```

**关键包版本（锁定）：**
- `electron`: ^33.0
- `electron-vite`: ^2.0
- `electron-builder`: ^25.0

### 步骤 2：创建 electron-vite 配置

#### 2.1 删除旧配置

删除 `vite.config.ts`（功能由 electron.vite.config.ts 替代）。

#### 2.2 新增 `electron.vite.config.ts`

同时管理三个构建目标：

```typescript
// electron.vite.config.ts
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    // 主进程配置
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    // 预加载脚本配置
  },
  renderer: {
    plugins: [react()],
    // 渲染进程（React）配置，与原来 vite.config.ts 一致
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 3000,
    },
  },
});
```

#### 2.3 调整 TypeScript 配置

- `tsconfig.json`：根配置，不直接编译，只做引用
- `tsconfig.node.json`：包含 `electron/` 目录（Node 环境）
- `tsconfig.web.json`：包含 `src/` 目录（浏览器环境）

### 步骤 3：编写 Main Process（主进程）

#### 3.1 `electron/main.ts` — 主进程入口

核心功能：
1. **窗口管理**：创建 BrowserWindow，设置尺寸 1400×900，标题栏带自定义图标
2. **原生菜单**：文件菜单（导出/导入/退出）+ 编辑菜单 + 帮助菜单
3. **系统托盘**：最小化到系统托盘，右键菜单恢复/退出
4. **IPC 通信注册**：
   - `save-file`：保存对局 JSON 文件（原生保存对话框）
   - `open-file`：打开已有 JSON 文件进行回填

#### 3.2 `electron/preload.ts` — 预加载脚本

使用 `contextBridge.exposeInMainWorld` 暴露安全 API：

```typescript
// 暴露给渲染进程的安全方法
contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (data: string) => ipcRenderer.invoke('save-file', data),
  openFile: () => ipcRenderer.invoke('open-file'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onMenuAction: (callback) => ipcRenderer.on('menu-action', callback),
});
```

#### 3.3 `electron/menu.ts` — 菜单定义

```typescript
// 原生菜单模板
const menuTemplate: MenuItemConstructorOptions[] = [
  {
    label: '文件',
    submenu: [
      { label: '导出对局 JSON', accelerator: 'CmdOrCtrl+S', click: ... },
      { label: '导入对局 JSON', accelerator: 'CmdOrCtrl+O', click: ... },
      { type: 'separator' },
      { label: '退出', accelerator: 'CmdOrCtrl+Q', role: 'quit' },
    ],
  },
  { label: '编辑', role: 'editMenu' },
  { label: '查看', submenu: [开发者工具, 刷新, 全屏] },
  { label: '帮助', submenu: [关于本应用] },
];
```

### 步骤 4：渲染进程适配

这是改动最小的部分，需要适配的点：

#### 4.1 全局类型声明新增

在 `vite-env.d.ts`（或新建 `src/types/electron.d.ts`）中声明：

```typescript
interface ElectronAPI {
  saveFile: (data: string) => Promise<{ success: boolean; message: string }>;
  openFile: () => Promise<{ success: boolean; data?: unknown; message?: string }>;
  getAppVersion: () => Promise<string>;
  onMenuAction: (callback: (action: string) => void) => void;
}

interface Window {
  electronAPI?: ElectronAPI;
}
```

#### 4.2 `src/utils/export.ts` 改动

将原有的 `document.createElement('a')` 方式导出，改为：
- 当 `window.electronAPI` 可用时，调用 `electronAPI.saveFile()` 打开原生保存对话框
- 当不可用（浏览器环境）时，保持原有下载方式

#### 4.3 `src/App.tsx` 改动

新增导入功能：
- 通过 `window.electronAPI.openFile()` 打开 JSON 文件
- 解析数据后调用状态 setter 回填到 UI（还原 winner、team、rounds）

#### 4.4 `index.html` 确认

确认 CSP（Content Security Policy）允许脚本和样式，适配 Electron 渲染环境。

### 步骤 5：配置打包

#### 5.1 新增 `electron-builder.yml`

```yaml
appId: com.rocopvp.battle-recorder
productName: 洛克王国PVP对局录入工具
copyright: Copyright © 2024

directories:
  output: release
  buildResources: resources

files:
  - dist/**/*
  - !node_modules

win:
  target:
    - target: nsis
      arch: [x64]
  artifactName: ${productName}-Setup-${version}-${arch}.${ext}

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true

mac:
  target:
    - target: dmg
      arch: [x64, arm64]
  artifactName: ${productName}-${version}-${arch}.${ext}
  category: public.app-category.utilities

dmg:
  contents:
    - x: 130
      y: 220
    - x: 410
      y: 220
      type: link
      path: /Applications
```

#### 5.2 更新 package.json 脚本

```json
{
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "pack": "electron-vite build && electron-builder --dir",
    "dist:win": "electron-vite build && electron-builder --win",
    "dist:mac": "electron-vite build && electron-builder --mac",
    "dist": "electron-vite build && electron-builder --win --mac"
  }
}
```

### 步骤 6：应用图标

- 准备一张 1024×1024 的 PNG 图标，放到 `resources/icon.png`
- `electron-builder` 将自动生成各平台所需的图标格式（.ico / .icns）

---

## 四、IPC 通信设计

### 4.1 通道列表

| 通道名 | 方向 | 用途 |
|--------|------|------|
| `save-file` | Renderer → Main (invoke) | 保存 JSON 到本地文件 |
| `open-file` | Renderer → Main (invoke) | 打开本地 JSON 文件 |
| `get-app-version` | Renderer → Main (invoke) | 获取应用版本号 |
| `menu-action` | Main → Renderer (send) | 菜单触发的事件通知 |

### 4.2 数据流

```
[用户点击导出]
    │
    ▼
[React: App.tsx]
    │ 调用 window.electronAPI.saveFile(jsonString)
    ▼
[Preload: contextBridge]
    │ 转发 ipcRenderer.invoke('save-file', jsonString)
    ▼
[Main: main.ts]
    │ 弹出 dialog.showSaveDialog()
    │ 写入 fs.writeFile()
    │ 返回 { success: true }
    ▼
[React: 收到结果，显示 message.success()]
```

```
[用户菜单 → 导入]
    │
    ▼
[Main: main.ts]
    │ 菜单点击触发
    │ 发送 'menu-action', { action: 'import' }
    ▼
[Preload → Renderer]
    │ 触发 onMenuAction 回调
    ▼
[React: App.tsx]
    │ 调用 window.electronAPI.openFile()
    ▼
[Main: main.ts]
    │ 弹出 dialog.showOpenDialog()
    │ 读取 JSON，返回数据
    ▼
[React: 解析数据回填到状态]
```

---

## 五、风险点 & 注意事项

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| `electron-vite` 与现有 Vite 配置兼容 | 中 | 逐步迁移，先验证 dev 模式 |
| Ant Design 在 Electron 下的表现 | 低 | Electron 使用 Chromium，兼容 Ant Design |
| JSON 配置文件导入方式 | 低 | `electron-vite` 渲染进程支持 JSON import |
| 跨平台打包差异 | 低 | electron-builder 成熟稳定，Win 测试完整 |
| CSP 安全策略限制 | 中 | index.html 添加合适 meta 标签 |

---

## 六、验证清单

- [ ] `npm run dev` 正常启动 Electron 窗口，显示 React UI
- [ ] 所有现有功能（阵容选择/回合管理/增益减益/行动/导出）正常
- [ ] 原生菜单点击正常工作
- [ ] 系统托盘最小化/恢复正常
- [ ] IPC 导出保存对话框正常
- [ ] IPC 导入打开对话框正常
- [ ] `npm run dist:win` 生成 Windows 安装包
- [ ] 安装包安装后应用正常启动

---

## 七、预计新增/变更文件清单

### 新增文件（8个）

| 文件 | 大小估算 | 说明 |
|------|----------|------|
| `electron/main.ts` | ~80行 | 主进程入口 |
| `electron/preload.ts` | ~30行 | 预加载桥接 |
| `electron/menu.ts` | ~40行 | 原生菜单 |
| `electron.vite.config.ts` | ~30行 | electron-vite 配置 |
| `electron-builder.yml` | ~30行 | 打包配置 |
| `tsconfig.web.json` | ~10行 | 渲染进程 TS 配置 |
| `src/types/electron.d.ts` | ~15行 | Electron API 类型声明 |
| `resources/icon.png` | — | 应用图标（需要用户提供） |

### 修改文件（5个）

| 文件 | 改动幅度 | 说明 |
|------|----------|------|
| `package.json` | 中 | 依赖 + 脚本 + main 字段 |
| `tsconfig.json` | 小 | references 调整 |
| `tsconfig.node.json` | 小 | include electron/ |
| `src/utils/export.ts` | 小 | 适配 Electron 原生保存 |
| `src/App.tsx` | 小 | 支持导入菜单回调 |

### 删除文件（1个）

| 文件 | 说明 |
|------|------|
| `vite.config.ts` | 被 `electron.vite.config.ts` 替代 |
