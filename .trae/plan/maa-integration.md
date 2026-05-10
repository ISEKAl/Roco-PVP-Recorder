# MaaFramework 集成计划 —— 对局截图识别与数据回填

> 目标：实现一键截图游戏窗口 → 图像识别解析对局信息 → 自动回填到 UI

## 一、现状回顾

### 1.1 已有基础设施

| 组件 | 状态 | 说明 |
|------|------|------|
| Electron 窗口 | ✅ | 1400×900，主进程 `electron/main.ts` |
| IPC 通道 | ✅ | `contextBridge` + `ipcMain.handle` 模式 |
| 导入回填 | ✅ | `handleImport()` 已实现从 JSON 恢复全部状态 |
| TypeScript | ✅ | strict 模式，类型体系完善 |
| 打包 | ✅ | electron-builder + electron-vite |

### 1.2 目标工作流

```
用户点击「识别对局」按钮
        │
        ▼
┌───────────────────────────────────────────┐
│  Main Process (electron/main.ts)          │
│                                           │
│  ① maa/recognizer.ts                      │
│     Win32Controller 连接游戏窗口           │
│     截图当前画面                           │
│                                           │
│  ② Pipeline 执行                          │
│     模板匹配 → 识别精灵名称（头像）        │
│     OCR       → 识别 HP 比例 / 能量值     │
│     模板匹配 → 识别增益减益图标/数值       │
│                                           │
│  ③ 组装识别结果 → RecognizedRound         │
│     通过 IPC 返回给渲染进程                │
└───────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────┐
│  Renderer Process (src/App.tsx)           │
│                                           │
│  ④ 收到识别结果                           │
│     setWinner / setTeam1 / setTeam2        │
│     importBattleData() 写入回合数据        │
│     滚动到当前回合                        │
│                                           │
│  ⑤ 用户确认/微调后继续下一回合识别         │
└───────────────────────────────────────────┘
```

---

## 二、新增/变更文件清单

### 新增文件（7 个）

| 文件 | 说明 |
|------|------|
| `electron/maa/types.ts` | MaaFramework 集成层类型定义 |
| `electron/maa/recognizer.ts` | 截图 + Pipeline 执行 + 结果解析 |
| `electron/maa/pipeline.ts` | Pipeline JSON 动态生成 |
| `pipeline/` 目录 | 模板图片 + JSON 任务配置 |
| `pipeline/battle.json` | 顶层任务编排 JSON |
| `pipeline/recognize_*.json` | 各子任务 Pipeline（宠物/HP/能量/buff） |
| `pipeline/images/*.png` | 精灵头像、buff 图标等模板图 |

### 修改文件（6 个）

| 文件 | 改动 |
|------|------|
| `package.json` | 添加 `@maaxyz/maa-node` 依赖 |
| `electron/main.ts` | `registerIPC()` 新增 `recognize-round` 通道；用 `try/catch` 延迟加载 maa |
| `electron/preload.ts` | 暴露 `recognizeRound` 方法 |
| `src/types/electron.d.ts` | `ElectronAPI` 新增 `recognizeRound` 签名 |
| `src/App.tsx` | 新增 `handleRecognize()`；菜单 `menu-action: recognize` 回调 |
| `electron-builder.yml` | 添加 `asarUnpack` 处理原生 `.node` 文件 |

---

## 三、执行步骤

### 步骤 1：安装依赖

```bash
npm install @maaxyz/maa-node
```

> 注意：此包含 MaaFramework 原生库 + AgentBinary，下载较大（~100MB），需要代理。

### 步骤 2：创建 Pipeline 类型定义

#### `electron/maa/types.ts`

```typescript
// 单次识别结果：当前回合某一方的状态
export interface RecognizedPlayerState {
  active_pet: string;         // 场上精灵名称
  hp_ratio: number;           // HP 比例 0~1
  mp: number;                 // 能量值 0~10
  buff: Record<string, number>; // 增益减益
  action_type: 'skill' | 'switch' | null;
  action_skill_name?: string;
  action_switch_to?: string;
}

// 单个回合的识别结果
export interface RecognizedRound {
  cur_round: number;
  player_1: RecognizedPlayerState;
  player_2: RecognizedPlayerState;
}

// 识别结果汇总
export interface RecognizeResult {
  success: boolean;
  message: string;
  rounds?: RecognizedRound[];
}
```

### 步骤 3：封装 MaaFramework 调用

#### `electron/maa/recognizer.ts`

核心职责：
1. 加载 `@maaxyz/maa-node`
2. 初始化 Resource（加载 `pipeline/` 目录）
3. 创建 Win32Controller 连接游戏窗口
4. 对每个回合执行截图识别 Pipeline
5. 解析结果，组装成 `RecognizedRound[]`

```typescript
import * as maa from '@maaxyz/maa-node';
import { RecognizedRound, RecognizeResult } from './types';

let maaInitialized = false;
let res: maa.Resource | null = null;

// 初始化 MAA（应用启动时调用一次）
export async function initMaa(resourcePath: string): Promise<void> {
  maa.Global.set_option('LogDir', resourcePath + '/../debug');
  
  res = new maa.Resource();
  res.add_sink((_: number, msg: string) => console.log('[MaaRes]', msg));
  await res.post_bundle(resourcePath).wait();
  
  maaInitialized = true;
}

// 执行单回合识别
export async function recognizeRound(
  windowHandle: number,
  roundNumber: number,
): Promise<RecognizeResult> {
  if (!maaInitialized) {
    return { success: false, message: 'MAA 未初始化' };
  }

  // 创建 Win32 控制器，绑定游戏窗口
  const ctrl = new maa.Win32Controller(windowHandle);
  await ctrl.post_connection().wait();

  // 创建 Tasker
  const tskr = new maa.Tasker();
  tskr.controller = ctrl;
  tskr.resource = res!;

  // 执行识别任务
  const taskResult = await tskr.post_task('BattleRecognition').wait();
  
  if (!taskResult.success) {
    return { success: false, message: '识别失败' };
  }

  // 解析 NodeJS 自定义识别回调返回的数据
  // （在 pipeline 阶段实现具体的解析逻辑）

  ctrl.destroy();
  tskr.destroy();

  return { success: true, message: '识别成功', rounds: [] };
}

// 销毁 MAA 资源
export function destroyMaa(): void {
  if (res) {
    res.destroy();
    res = null;
  }
  maaInitialized = false;
}
```

### 步骤 4：Pipeline 设计

#### 4.1 目录结构

```
pipeline/
├── battle.json              # 主任务入口
├── recognize_active_pet.json # 识别场上精灵
├── recognize_hp.json        # 识别 HP 比例
├── recognize_mp.json        # 识别能量值
├── recognize_buff.json      # 识别增益减益
├── recognize_action.json    # 识别行动
└── images/
    ├── pets/                # 精灵头像模板（每只精灵一张）
    │   ├── dimo.png
    │   ├── ...
    └── buffs/               # buff 图标模板
        ├── attack_up.png
        ├── defense_up.png
        └── ...
```

#### 4.2 `pipeline/battle.json` 主任务

```json
{
  "BattleRecognition": {
    "next": [
      "RecognizePlayer1Pet",
      "RecognizePlayer2Pet",
      "RecognizePlayer1HP",
      "RecognizePlayer2HP",
      "RecognizePlayer1MP",
      "RecognizePlayer2MP",
      "RecognizePlayer1Buff",
      "RecognizePlayer2Buff",
      "RecognizePlayer1Action",
      "RecognizePlayer2Action"
    ]
  },
  "RecognizePlayer1Pet": {
    "recognition": "Custom",
    "custom_recognition": "recognize_pet",
    "custom_recognition_param": { "player": 1 },
    "action": "DoNothing"
  }
  // ... 其他子任务类似定义
}
```

#### 4.3 自定义识别注册（TypeScript 侧）

在 `recognizer.ts` 中注册自定义识别函数：

```typescript
// 精灵识别
res.register_custom_recognizer('recognize_pet', (self) => {
  // self.image 是当前截图
  // 可以用 MaaFramework 内置的 TemplateMatch 或 OCR
  // 此处通过调用子 task 完成
  const result = self.context.run_recognition(
    `TemplateMatch_Pet_${self.param.player}`,
    self.image,
  );
  return result;
});

// HP 比例识别
res.register_custom_recognizer('recognize_hp', (self) => {
  // OCR 识别 HP 数字，计算比例
  const result = self.context.run_recognition(
    `OCR_HP_${self.param.player}`,
    self.image,
  );
  // 解析 OCR 结果 (如 "85/100" → 0.85)
  return result;
});
```

### 步骤 5：更新 Electron 主进程

#### `electron/main.ts` 改动

```typescript
// 新增导入
import { initMaa, recognizeRound, destroyMaa } from './maa/recognizer';
import { join } from 'path';

// registerIPC() 中新增
ipcMain.handle('recognize-round', async (_event, roundNumber: number) => {
  try {
    const resourcePath = join(app.getAppPath(), 'pipeline');
    // 首次调用时初始化
    await initMaa(resourcePath);
    
    const hwnd = mainWindow?.getNativeWindowHandle().readInt32LE(0) ?? 0;
    const result = await recognizeRound(hwnd, roundNumber);
    return result;
  } catch (error) {
    return { 
      success: false, 
      message: `识别异常: ${(error as Error).message}` 
    };
  }
});

// app.on('will-quit') 中新增加
app.on('will-quit', () => {
  destroyMaa();
});
```

> **关键点**：游戏窗口和 Electron 窗口是两个不同的窗口。`recognizeRound` 的 `windowHandle` 应该是**游戏窗口**的 HWND，而不是 Electron 窗口。需要通过 `electron` 的 `desktopCapturer` 或 Windows API 获取游戏窗口句柄。

#### 获取游戏窗口句柄的方案

```typescript
// 通过 Windows API 查找洛克王国窗口
import { execSync } from 'child_process';

function findGameWindow(): number {
  // 方案 A：PowerShell 查找（简单可靠）
  const result = execSync(
    `powershell -Command "(Get-Process -Name '*roco*' -ErrorAction SilentlyContinue | Select-Object -First 1).MainWindowHandle"`
  ).toString().trim();
  return parseInt(result, 10) || 0;
  
  // 方案 B：node-ffi 调用 FindWindow（更精确）
  // FindWindow(null, "洛克王国");
}
```

### 步骤 6：更新 IPC 桥接

#### `electron/preload.ts` 改动

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  // ... 已有方法
  recognizeRound: (roundNumber: number) => 
    ipcRenderer.invoke('recognize-round', roundNumber),
});
```

#### `src/types/electron.d.ts` 改动

```typescript
export interface ElectronAPI {
  // ... 已有方法
  recognizeRound: (roundNumber: number) => 
    Promise<{ success: boolean; message: string; rounds?: unknown[] }>;
}
```

### 步骤 7：渲染进程 UI 改动

#### `src/App.tsx` 改动

```typescript
// 新增状态
const [isRecognizing, setIsRecognizing] = useState(false);

// 识别对局
const handleRecognize = useCallback(async () => {
  if (!window.electronAPI) {
    message.warning('识别功能仅在桌面应用中可用');
    return;
  }

  setIsRecognizing(true);
  const loadingKey = 'recognizing';
  message.loading({ content: '正在识别对局数据...', key: loadingKey, duration: 0 });

  const result = await window.electronAPI.recognizeRound(currentRoundIndex + 1);
  
  message.destroy(loadingKey);
  setIsRecognizing(false);

  if (!result.success) {
    message.error(result.message);
    return;
  }

  // 回填识别结果
  if (result.rounds) {
    // 同步到 useRounds
    message.success('识别完成，请核对数据');
  }
}, [currentRoundIndex]);

// useEffect 菜单监听中新增
case 'recognize':
  handleRecognize();
  break;
```

#### `src/components/BasicInfo.tsx` 改动

在导出按钮旁边增加「识别对局」按钮：

```tsx
<Space>
  <Button 
    type="primary" 
    icon={<CameraOutlined />} 
    onClick={onRecognize}
    loading={isRecognizing}
  >
    识别对局
  </Button>
  <Button type="primary" icon={<DownloadOutlined />} onClick={onExport}>
    导出 JSON
  </Button>
</Space>
```

### 步骤 8：打包配置

#### `electron-builder.yml` 改动

`@maaxyz/maa-node` 含原生 `.node` 文件和 `.dll`，不能被打包进 `app.asar`：

```yaml
asarUnpack:
  - "node_modules/@maaxyz/maa-node/**/*"

extraResources:
  - from: "pipeline"
    to: "pipeline"
  - from: "node_modules/@maaxyz/maa-node/bin"
    to: "maa-node-bin"
```

---

## 四、Pipeline 制作（工作量最大）

### 4.1 需要制作的模板图片

| 类别 | 数量 | 说明 |
|------|------|------|
| 精灵头像 | ~500+ | 每只精灵名对应一张头像模板（从 pokemon.json 获取），用于识别场上是哪只 |
| HP 槽 | 1 | ROI 区域截图，通过像素比例推算 HP% |
| 能量块 | 1 | ROI 区域截图，通过颜色块数量推算能量值 |
| Buff 图标 | 5 | 物攻/物防/特防/速度/特性各一张模板 |

### 4.2 制作方法（推荐 VSCode 插件）

利用 [Maa Pipeline Support](https://github.com/neko-para/maa-support-extension) VSCode 插件：
1. 截取游戏窗口画面
2. 用插件的截图功能框选 ROI（Region of Interest）
3. 导出模板图片 → 放入 `pipeline/images/`
4. 插件自动生成对应 Pipeline JSON

### 4.3 识别流程示意图

```
游戏画面 (1920×1080)
│
├── 左侧区域 (玩家1)
│   ├── [精灵头像] → 模板匹配置信度最高的精灵名
│   ├── [HP 槽区域] → OCR 读取 "当前HP/最大HP" → 计算比例
│   ├── [能量块区域] → 颜色计数 → 0~10
│   ├── [Buff 图标区域] → 模板匹配各 buff 图标 → 读取数值
│   └── [行动区域] → OCR 识别技能名 或 检测"更换精灵"文本
│
└── 右侧区域 (玩家2) —— 同上
```

---

## 五、多回合识别策略

洛克王国对局是多回合的，需要**逐回合截图识别**：

1. 用户手动操作一次截图（或设置快捷键）
2. 每次截图识别当前回合数据
3. 自动调用 `addRound()` 追加新回合
4. 如果识别出上一回合有行动（技能/换宠），自动填入

进阶方案：开启**定时截图**（如每 10 秒自动截一次），配合游戏回合计时器自动采集。

---

## 六、风险点

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| 模板图片制作工作量大 | 高 | 分批制作（常用精灵优先），支持手动修正识别结果 |
| MaaFramework 原生模块加载失败 | 中 | `try/catch` 包裹，识别功能不可用时优雅降级 |
| 游戏分辨率/窗口大小变化 | 中 | 固定窗口大小，或使用 Scale 自适应 |
| 精灵头像个别相似度过高 | 低 | 提高阈值 + 人工确认 |
| 打包后原生路径错乱 | 中 | 提前在 dev 环境验证 `extraResources` 路径 |

---

## 七、验证清单

- [ ] `npm install @maaxyz/maa-node` 成功，不报错
- [ ] `npm run dev` 启动后 MAA 初始化日志正常
- [ ] Pipeline 资源加载成功
- [ ] 能获取到游戏窗口句柄
- [ ] 截图识别返回精灵名/HP/能量数据
- [ ] 数据回填到 UI 正确显示
- [ ] `npm run build` 构建通过
- [ ] `npm run dist:win` 打包 exe 后识别功能正常
