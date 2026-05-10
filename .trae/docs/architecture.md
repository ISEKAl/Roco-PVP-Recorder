# 项目架构文档

> 洛克王国 PVP 对局录入工具
> 最后更新：2026-05-10（zustand 迁移完成）

---

## 一、项目概览

一个基于 **Electron + React + Vite + Ant Design** 的桌面应用，用于录入洛克王国 PVP 对局数据。支持多回合逐回合记录、精灵状态调节、增益减益调整、JSON 导入导出等功能。

### 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 桌面框架 | Electron | ^42.0.1 |
| UI 框架 | React | ^18.2.0 |
| 构建工具 | electron-vite | ^5.0.0 |
| UI 组件库 | Ant Design | ^5.12.0 |
| 图标库 | @ant-design/icons | ^5.2.6 |
| 状态管理 | zustand | ^5.0.13 |
| 类型系统 | TypeScript | ^6.0.3 |
| 打包工具 | electron-builder | ^26.8.1 |
| 部署 | gh-pages | ^6.3.0 |

---

## 二、目录结构

```
RocoPVP/
├── .trae/                          # IDE 辅助目录
│   ├── docs/                       # 知识沉淀文档（当前目录）
│   ├── plan/                       # 计划文档
│   │   ├── electron-migration.md   #   Electron 迁移计划
│   │   └── maa-integration.md      #   MAA 截图识别集成计划
│   ├── rules/                      # 编码规范
│   │   ├── 沉淀知识.md             #   知识沉淀规则
│   │   └── 生成前端代码准则.md     #   前端代码规范
│   └── TODO.md                     # 待办事项
├── config/                         # 顶层配置 JSON
│   ├── pokemon.json                #   精灵数据
│   └── skills.json                 #   技能数据
├── raw_data/                       # 原始数据示例
│   └── 示例.json
└── website/                        # 主项目目录（Electron + Vite + React）
    ├── electron/                   # Electron 主进程
    │   ├── main.ts                 #   主进程入口（窗口、菜单、IPC）
    │   ├── menu.ts                 #   原生菜单定义
    │   └── preload.ts              #   预加载脚本（contextBridge IPC 桥接）
    ├── src/                        # React 渲染进程
    │   ├── main.tsx                #   React 入口
    │   ├── App.tsx                 #   根组件
    │   ├── index.css               #   全局样式
    │   ├── components/             #   7 个组件
    │   │   ├── AppHeader.tsx       #     顶部标题栏
    │   │   ├── BasicInfo.tsx       #     基本信息（胜利方、阵容）
    │   │   ├── RoundNavigation.tsx #     回合导航与布局
    │   │   ├── PlayerPanel.tsx     #     玩家面板（状态/增益减益/行动）
    │   │   ├── PetDetailCard.tsx   #     在场精灵详情卡片
    │   │   ├── BenchPetButton.tsx  #     替补精灵悬浮按钮
    │   │   ├── EnergyBlocks.tsx    #     能量块可视化组件
    │   │   └── NumberInput.tsx     #     通用数字输入器
    │   ├── stores/                 #   状态管理
    │   │   └── battleStore.ts      #     zustand 统一 store
    │   ├── config/                 #   前端 JSON 配置
    │   │   ├── buffs.json          #     增益减益配置
    │   │   ├── pokemon.json        #     精灵数据
    │   │   └── skills.json         #     技能数据
    │   ├── constants/              #   常量定义
    │   │   └── index.ts            #     玩家主题、默认值、滑块配置
    │   ├── types/                  #   TypeScript 类型定义
    │   │   └── index.ts            #     所有业务类型
    │   └── utils/                  #   工具函数
    │       ├── export.ts           #     JSON 导入导出
    │       └── buff.ts             #     增益减益工具
    ├── electron-builder.yml        # Electron 打包配置
    ├── electron.vite.config.ts     # Vite 构建配置
    ├── index.html                  # HTML 入口
    ├── package.json                # 依赖配置
    ├── tsconfig.json               # TS 根配置
    ├── tsconfig.node.json          # TS Node 环境配置
    └── tsconfig.web.json           # TS Web 环境配置
```

---

## 三、Electron 进程模型

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
│  │ - 文件IO     │            │           │ │
│  └──────────────┘            └───────────┘ │
└─────────────────────────────────────────────┘
```

### IPC 通信通道

| 通道名 | 方向 | 用途 |
|--------|------|------|
| `save-file` | Renderer → Main (invoke) | 保存 JSON 到本地文件 |
| `open-file` | Renderer → Main (invoke) | 打开本地 JSON 文件 |
| `get-app-version` | Renderer → Main (invoke) | 获取应用版本号 |
| `menu-action` | Main → Renderer (send) | 菜单触发的事件通知 |

---

## 四、核心数据模型

### RoundData（回合数据）

```typescript
interface RoundData {
  cur_round: number;                    // 回合编号
  player_1: PlayerRoundState;           // 玩家1 回合状态
  player_2: PlayerRoundState;           // 玩家2 回合状态
}

interface PlayerRoundState {
  active_pet: string;                   // 当前场上精灵名称
  pets: PetState[];                     // 阵容精灵状态数组
  buff: Buff;                           // 增益减益
  action: Action | null;                // 行动记录
}

interface PetState {
  name: string;                         // 精灵名称
  hp_ratio: number;                     // HP 比例 (0~1)
  mp: number;                           // 能量值 (0~10)
}

interface Action {
  type: 'skill' | 'switch' | null;      // 行动类型
  skill_name?: string | null;           // 技能名称
  to?: string | null;                   // 换宠目标精灵名
}

type Buff = Record<string, number>;     // key → 数值 (如 "attack": 2)
```

### BattleExportData（导出数据格式）

```typescript
interface BattleExportData {
  time: string;            // ISO 时间戳
  winner: number;          // 胜利方 (1 或 2)
  total_round: number;     // 总回合数
  team_1: string[];        // 玩家1 阵容
  team_2: string[];        // 玩家2 阵容
  round: RoundData[];      // 回合数据数组
}
```

---

## 五、功能清单

| 功能 | 状态 | 说明 |
|------|------|------|
| 双方阵容选择 | ✅ | 最多6只精灵，支持搜索 |
| 多回合管理 | ✅ | 添加/删除/删除全部/导航 |
| 场上精灵切换 | ✅ | Select 下拉 + 点击精灵名切换 |
| HP 调节 | ✅ | 滑块 + 数字输入 (0~1, step 0.05) |
| 能量调节 | ✅ | 能量块点击 + 数字输入 (0~10) |
| 增益减益 | ✅ | 5项属性独立调节 (+10~-6) |
| 行动选择 | ✅ | 使用技能 / 更换精灵 |
| JSON 导出 | ✅ | Electron: 原生保存对话框；浏览器: 下载 |
| JSON 导入 | ✅ | Electron: 原生打开对话框；回填状态 |
| 原生菜单 | ✅ | 文件菜单（导出/导入/退出）+ 编辑 + 帮助 |
| 桌面打包 | ✅ | Windows NSIS 安装包 / macOS DMG |
| MAA 截图识别 | 📋 | 计划中：对局截图 → 自动回填数据 |

---

## 六、现有编码规范

1. 布局美观（左右对齐、上下对齐）
2. 响应式布局（不同屏幕尺寸正常显示）
3. 代码架构合理
4. 禁止 `as` 强制类型断言，应使用 `typeof` 类型守卫
5. 代码生成时默认添加注释
6. 修复 bug 后将知识沉淀到 `.trae/docs/`
