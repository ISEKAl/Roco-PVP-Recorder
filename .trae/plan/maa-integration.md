# MaaFramework 集成计划 —— 悬浮工具球 + 阵容截图识别

> 目标：悬浮工具球 → 点击「识别双方阵容」→ 截图"洛克王国：世界"窗口 → 模板匹配识别双方精灵名 → 通过 `store.patchState()` 回填

---

## 一、用户使用流程

```
应用启动
  │
  ▼
┌────────────────────────────────────────────┐
│  ┌──────────┐                              │
│  │  主界面   │                              │
│  │          │         ⚡  ← 工具球悬浮      │
│  │  阵容    │            （可拖拽）          │
│  │  回合    │                              │
│  │  ...     │                              │
│  └──────────┘                              │
└────────────────────────────────────────────┘
       │
       │  鼠标悬浮到 ⚡ 上
       ▼
  ┌──────────────┐
  │ 📸 识别双方阵容│  ← 弹出菜单（只有一个选项）
  └──────────────┘
       │
       │  点击
       ▼
  ① PowerShell 查找"洛克王国：世界"窗口 HWND
  ② Win32Controller 截图
  ③ 在阵容区域 ROI 内遍历精灵头像模板，逐个匹配
  ④ 返回 BattlePatch = { team1: string[], team2: string[] }
  ⑤ store.patchState({ team1, team2 })  → UI 自动更新
  ⑥ message.success('识别完成')
```

---

## 二、新增/变更文件清单

### 新增文件（10 个）

| 文件 | 说明 |
|------|------|
| `electron/maa/types.ts` | 识别结果类型定义 |
| `electron/maa/recognizer.ts` | 截图 + 模板匹配 + 结果解析 |
| `electron/maa/templates.ts` | 模板图片下载（从 pokemon.json 的 image_url） |
| `electron/maa/pipeline.ts` | Pipeline JSON 动态生成 |
| `src/components/ToolBall.tsx` | 悬浮工具球 + 拖拽 + 菜单位置记忆 |
| `scripts/download-templates.ts` | 下载模板的独立脚本（npm run download-templates） |
| `resources/templates/pets/*.png` | 每个精灵一张头像模板（`<精灵名>.png`） |

### 修改文件（6 个）

| 文件 | 改动 |
|------|------|
| `package.json` | 添加 `@maaxyz/maa-node` 依赖 + `download-templates` 脚本 |
| `electron/main.ts` | 新增 `recognize-teams` IPC 通道 |
| `electron/preload.ts` | 暴露 `recognizeTeams` / `saveBallPosition` / `loadBallPosition` |
| `src/types/electron.d.ts` | `ElectronAPI` 新增对应签名 |
| `src/App.tsx` | render `<ToolBall />` |
| `electron-builder.yml` | asarUnpack + extraResources 处理原生文件 |

---

## 三、执行步骤

### 步骤 1：安装依赖

```bash
npm install @maaxyz/maa-node
```

> 含 MaaFramework 原生库 + AgentBinary，较大（~100MB）。

### 步骤 2：下载模板图片

#### 2.1 数据来源

`website/src/config/pokemon.json` 中每只精灵有 `image_url` 字段，例如：

```json
{ "id": 1, "name": "迪莫", "image_url": "https://patchwiki.biligame.com/..." }
```

#### 2.2 下载脚本 `scripts/download-templates.ts`

```typescript
// 读取 pokemon.json → 遍历 → download(image_url) → 保存为 resources/templates/pets/<精灵名>.png
import pokemonData from '../src/config/pokemon.json';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const OUT_DIR = join(__dirname, '../resources/templates/pets');
mkdirSync(OUT_DIR, { recursive: true });

for (const p of pokemonData) {
  if (!p.image_url) continue;
  const res = await fetch(p.image_url);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(join(OUT_DIR, `${p.name}.png`), buf);
  console.log(`✓ ${p.name}`);
}
```

> 运行时直接读取 `resources/templates/pets/` 目录下按 `<精灵名>.png` 命名的文件作为模板。

#### 2.3 新增 package.json 脚本

```json
"download-templates": "npx tsx scripts/download-templates.ts"
```

### 步骤 3：MaaFramework 类型 & 识别器

#### 3.1 `electron/maa/types.ts`

```typescript
import type { BattlePatch } from '../../src/stores/battleStore';

// 所有识别结果统一使用 BattlePatch 作为返回值
// BattlePatch = Partial<BattleState> → 用覆盖的方式回填
// 当前阵容识别：{ team1: string[], team2: string[] }
// 未来回合识别：{ rounds: RoundData[], winner: number, ... }
export interface RecognitionResult {
  success: boolean;
  message: string;
  patch: BattlePatch;
}
```

> **设计意图**：不写专用的 `setTeam()` / `setRounds()` 等回填函数。所有识别器统一返回 `BattlePatch`，调用方一行 `store.patchState(patch)` 即可覆盖。将来无论识别什么内容（阵容 / HP / 能量 / buff / 回合），都是同一个接口。

#### 3.2 `electron/maa/templates.ts` — 模板管理

```typescript
// 读取 resources/templates/pets/ 下所有 .png 文件 → Map<精灵名, ImageBuffer>
export async function loadTemplates(): Promise<Map<string, maa.ImageBuffer>> {
  const dir = join(__dirname, '../../resources/templates/pets');
  const files = readdirSync(dir).filter(f => f.endsWith('.png'));
  const map = new Map<string, maa.ImageBuffer>();
  for (const f of files) {
    const name = f.replace('.png', '');
    const buf = readFileSync(join(dir, f));
    const img = new maa.ImageBuffer();
    img.set_raw(buf);
    map.set(name, img);
  }
  return map;
}
```

#### 3.3 `electron/maa/recognizer.ts` — 核心识别器

核心识别策略：

```
整张截图 (e.g. 1920×1080)
       │
       │  从正中间竖切一刀
       ▼
┌──────────────────┬──────────────────┐
│   左半张图片      │   右半张图片      │
│   (0 ~ 960)      │   (960 ~ 1920)   │
│                  │                  │
│   ← 玩家1的阵容   │   玩家2的阵容 →   │
│   在这半张里做    │   在这半张里做    │
│   模板匹配        │   模板匹配        │
└──────────────────┴──────────────────┘
```

**左右天然隔离，绝无混淆可能。**

```typescript
// 核心代码伪代码
const screenshot = await ctrl.screencap();

// 从正中间切开
const leftHalf  = screenshot.crop(0, 0, screenshot.width / 2, screenshot.height);
const rightHalf = screenshot.crop(screenshot.width / 2, 0, screenshot.width / 2, screenshot.height);

// 各自在自己那一半里匹配
const team1 = matchPets(leftHalf, templates);   // 怎么匹配都只命中左边
const team2 = matchPets(rightHalf, templates);  // 怎么匹配都只命中右边
```

> **无需 ROI 校准**：左右半图就是天然边界。如果游戏画面不是全屏（窗口模式），以实际截图宽度 / 2 为准，与分辨率无关。

### 步骤 4：Pipeline 设计

简化到极致 — 只需要一个自定义识别任务，参数就是模板路径：

```json
{
  "TeamRecognition": {
    "recognition": "Custom",
    "custom_recognition": "recognize_teams",
    "action": "DoNothing"
  }
}
```

`recognize_teams` 在 TypeScript 侧实现，内部逻辑：
1. 拿到 `self.image`（整张截图）
2. `左半张 = crop(0, 0, w/2, h)` → 模板匹配所有精灵 → 玩家1 阵容 `string[]`
3. `右半张 = crop(w/2, 0, w/2, h)` → 模板匹配所有精灵 → 玩家2 阵容 `string[]`
4. 返回 `[{ team1: [...], team2: [...] }]`

### 步骤 5：查找游戏窗口

```typescript
// electron/maa/recognizer.ts
import { execSync } from 'child_process';

function findGameWindow(): number {
  // "洛克王国：世界" 是游戏窗口标题
  const ps = `
    Add-Type @"
      using System;
      using System.Runtime.InteropServices;
      public class Win32 {
        [DllImport("user32.dll")] public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
      }
"@
    $hwnd = [Win32]::FindWindow($null, '洛克王国：世界')
    if ($hwnd -eq [IntPtr]::Zero) { exit 1 }
    Write-Output $hwnd
  `;
  const result = execSync(`powershell -Command "${ps.replace(/\n/g, ' ')}"`).toString().trim();
  return parseInt(result, 10) || 0;
}
```

### 步骤 6：更新 Electron 主进程

#### `electron/main.ts` 新增 IPC

```typescript
// 新增
import { recognizeTeamBattle, initMaa, destroyMaa } from './maa/recognizer';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

// --- registerIPC() 中新增 ---

// 识别双方阵容
ipcMain.handle('recognize-teams', async () => {
  try {
    const resourcePath = join(app.getPath('userData'), 'maa_resources');
    await initMaa(resourcePath);

    const hwnd = findGameWindow();
    if (!hwnd) {
      return { success: false, message: '未找到游戏窗口，请先打开洛克王国：世界' };
    }

    const result = await recognizeTeamBattle(hwnd);
    return result;
  } catch (error) {
    return { success: false, message: `识别异常: ${(error as Error).message}` };
  }
});

// 保存悬浮球位置
const BALL_POSITION_FILE = 'toolball-position.json';
ipcMain.handle('save-ball-position', async (_e, pos: { x: number; y: number }) => {
  const dir = app.getPath('userData');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, BALL_POSITION_FILE), JSON.stringify(pos), 'utf-8');
});

ipcMain.handle('load-ball-position', async () => {
  const file = join(app.getPath('userData'), BALL_POSITION_FILE);
  if (!existsSync(file)) return null;
  const raw = readFileSync(file, 'utf-8');
  return JSON.parse(raw);
});

// --- app.on('will-quit') 中新增 ---
app.on('will-quit', () => {
  destroyMaa();
});
```

### 步骤 7：更新 IPC 桥接

#### `electron/preload.ts`

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  // ... 已有方法
  recognizeTeams: () => ipcRenderer.invoke('recognize-teams'),
  saveBallPosition: (pos: { x: number; y: number }) =>
    ipcRenderer.invoke('save-ball-position', pos),
  loadBallPosition: () => ipcRenderer.invoke('load-ball-position'),
});
```

#### `src/types/electron.d.ts`

```typescript
import type { BattlePatch } from '../stores/battleStore';

interface RecognitionResult {
  success: boolean;
  message: string;
  patch: BattlePatch;
}

export interface ElectronAPI {
  // ... 已有方法
  recognizeTeams: () => Promise<RecognitionResult>;
  saveBallPosition: (pos: { x: number; y: number }) => Promise<void>;
  loadBallPosition: () => Promise<{ x: number; y: number } | null>;
}
```

### 步骤 8：悬浮工具球组件

#### `src/components/ToolBall.tsx`

```
┌─────────────────────────────────────┐
│              ToolBall                │
│                                     │
│  Props: 无                          │
│                                     │
│  内部状态：                          │
│    position: {x, y}   ← 初始从      │
│    menuVisible        ← hover控制   │
│    isRecognizing                     │
│                                     │
│  生命周期：                          │
│    useEffect → loadBallPosition()   │
│    拖拽结束 → saveBallPosition()    │
│                                     │
│  行为：                             │
│    mousedown → 开始拖拽              │
│    mousemove → 跟随鼠标             │
│    mouseup   → 停止拖拽 + 保存位置   │
│    mouseenter → 显示菜单            │
│    mouseleave → 隐藏菜单            │
│                                     │
│  渲染：                             │
│    ┌────┐                           │
│    │ ⚡ │  ← 固定大小圆形悬浮球      │
│    └────┘                           │
│      │ (hover)                      │
│      ▼                              │
│  ┌──────────────┐                   │
│  │ 📸 识别双方阵容│  ← Popover/Dropdown│
│  └──────────────┘                   │
└─────────────────────────────────────┘
```

```tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Popover, message, Spin } from 'antd';
import { CameraOutlined } from '@ant-design/icons';
import { useBattleStore } from '../stores/battleStore';

const DEFAULT_POSITION = { x: window.innerWidth - 80, y: window.innerHeight - 200 };

const ToolBall: React.FC = () => {
  const [position, setPosition] = useState(DEFAULT_POSITION);
  const [isDragging, setIsDragging] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const ballRef = useRef<HTMLDivElement>(null);

  // 加载保存的位置
  useEffect(() => {
    if (!window.electronAPI) return;
    window.electronAPI.loadBallPosition().then((pos) => {
      if (pos) setPosition(pos);
    });
  }, []);

  // 拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    };
    const handleUp = () => {
      if (isDragging) {
        setIsDragging(false);
        // 保存位置
        window.electronAPI?.saveBallPosition(position);
      }
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, position]);

  // 识别阵容
  const handleRecognize = async () => {
    if (!window.electronAPI) {
      message.warning('识别功能仅在桌面应用中可用');
      return;
    }
    setMenuVisible(false);
    setIsRecognizing(true);
    const result = await window.electronAPI.recognizeTeams();
    setIsRecognizing(false);

    if (!result.success) {
      message.error(result.message);
      return;
    }

    const store = useBattleStore.getState();
    store.patchState(result.patch);
    message.success(`识别完成！玩家1: ${result.patch.team1?.length ?? 0}只，玩家2: ${result.patch.team2?.length ?? 0}只`);
  };

  // ... render JSX
};
```

### 步骤 9：App.tsx 集成

```tsx
// 新增 import
import ToolBall from './components/ToolBall';

// return 中新增
<Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
  <AppHeader />
  <Content style={{ padding: '24px' }}>
    {/* ... */}
  </Content>
  <ToolBall />  {/* 悬浮在最上层 */}
</Layout>
```

### 步骤 10：打包配置

```yaml
# electron-builder.yml 新增
asarUnpack:
  - "node_modules/@maaxyz/maa-node/**/*"

extraResources:
  - from: "resources/templates"
    to: "templates"
```

---

## 四、组件数据流

```
ToolBall (渲染进程)
  │  鼠标悬浮 → menuVisible = true
  │  点击「识别双方阵容」
  │
  ├─► window.electronAPI.recognizeTeams()
  │     │
  │     ▼
  │   Preload: ipcRenderer.invoke('recognize-teams')
  │     │
  │     ▼
  │   Main: ipcMain.handle('recognize-teams')
  │     │
  │     ├─► findGameWindow() → HWND
  │     ├─► new maa.Win32Controller(hwnd)
  │     ├─► ctrl.screencap()
  │     ├─► Pipeline 执行 (TeamRecognition)
  │     │     ├── recognize_team(area=team1) → 模板匹配 → string[]
  │     │     └── recognize_team(area=team2) → 模板匹配 → string[]
  │     └─► return { success, patch: { team1: [...], team2: [...] } }

  └─► store.patchState(result.patch)
        → BasicInfo.tsx 的 Select 自动更新显示
```

---

## 五、模板匹配策略

```
整张截图 (e.g. 1920×1080)
       │  宽度 / 2 = 960
       ▼
┌──────────────────┬──────────────────┐
│   左半张 = 玩家1  │   右半张 = 玩家2  │ ← 天然边界，无须校准
│                  │                  │
│ 每个精灵头像在    │ 每个精灵头像在    │
│ 这半张内遍历匹配  │ 这半张内遍历匹配  │
│ 所有500+模板     │ 所有500+模板     │
│                  │                  │
│ 返回 team1[]     │ 返回 team2[]     │
└──────────────────┴──────────────────┘
```

每半张内的匹配逻辑：
1. 对该半张内所有可能的精灵头像位置（按固定间距扫描）提取子图
2. 每个子图用 `TemplateMatch` 对 `resources/templates/pets/` 下所有 `.png` 匹配
3. 取置信度最高的名称，阈值 > 0.7
4. 如果某个位置所有模板置信度都 < 阈值 → 该位置为空（阵容已结束），停止扫描

> **无混淆保证**：左半张的任何像素都不属于右半张。不管模板匹配算法怎么跑，左半张的结果永远是玩家1，右半张永远是玩家2。

---

## 六、风险点

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| 模板图片下载量大 (~500张) | 中 | 单独脚本，打包时预置 |
| 游戏窗口非全屏/分辨率变化 | 低 | 以实际截图宽度 / 2 为分界线，与分辨率无关 |
| 精灵头像相似度低 | 低 | 所有模板来自同一来源，匹配稳定 |
| `@maaxyz/maa-node` 下载失败 | 中 | 设置代理镜像 |
| 原生模块打包路径错误 | 中 | 提前在 dev 环境验证路径 |

---

## 七、验证清单

- [ ] `npm run download-templates` 成功下载所有模板
- [ ] `npm install @maaxyz/maa-node` 成功
- [ ] `npm run dev` 启动 → 悬浮球显示
- [ ] 悬浮球可拖拽 → 重启后位置保持
- [ ] 悬浮 → 显示菜单 → 点击 → loading 提示
- [ ] 能够查找到"洛克王国：世界"窗口
- [ ] 截图成功并返回 { team1, team2 }
- [ ] setTeam 回填后 BasicInfo Select 显示正确
- [ ] `npm run build` 构建通过
- [ ] `npm run dist:win` 打包后功能正常

---

## 八、后续扩展

| 阶段 | 内容 |
|------|------|
| Phase 1（当前） | 阵容识别（仅精灵名） |
| Phase 2 | + HP 比例识别（OCR 或像素色彩比例） |
| Phase 3 | + 能量值识别（颜色块计数） |
| Phase 4 | + buff/debuff 识别（图标模板匹配） |
| Phase 5 | + 多回合自动采集（定时截图 + 自动 addRound） |
