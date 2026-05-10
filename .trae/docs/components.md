# 组件树与职责文档

---

## 一、组件树

```
App.tsx
├── AppHeader.tsx                    # 顶部标题栏（无状态，纯展示）
├── BasicInfo.tsx                    # 基本信息卡片
│   ├── Select (胜利方)
│   ├── Select (玩家1 阵容)
│   └── Select (玩家2 阵容)
└── RoundNavigation.tsx             # 回合导航包裹容器
    ├── Tabs (回合标签页)
    ├── Button (上一回合 / 下一回合 / 删除 / 添加)
    ├── PlayerPanel.tsx [playerNum=1]   # 玩家1 面板
    │   ├── Select (场上精灵)
    │   ├── PetDetailCard.tsx           #   在场精灵详情
    │   │   ├── Slider (HP 滑块)
    │   │   ├── NumberInput (HP 数字输入)
    │   │   └── EnergyBlocks (能量块)
    │   │       └── NumberInput (能量数字输入)
    │   ├── BenchPetButton.tsx          #   替补精灵悬浮弹出
    │   │   ├── Card (悬浮弹出层)
    │   │   │   ├── Slider (HP 滑块)
    │   │   │   ├── NumberInput (HP 数字输入)
    │   │   │   └── EnergyBlocks (能量块)
    │   │   │       └── NumberInput (能量数字输入)
    │   ├── NumberInput[] (增益减益 × 5)
    │   └── Select[] (行动类型 / 技能 / 换宠目标)
    └── PlayerPanel.tsx [playerNum=2]   # 玩家2 面板（结构同上）
```

---

## 二、各组件详细说明

### 2.1 AppHeader.tsx

- **职责**：顶部标题栏
- **Props**：无
- **状态订阅**：无（纯 UI 组件）
- **依赖**：`Layout.Header`, `Typography.Title`

---

### 2.2 BasicInfo.tsx

- **职责**：显示/编辑胜利方和双方阵容
- **Props**：
  | 属性 | 类型 | 说明 |
  |------|------|------|
  | `pokemonList` | `string[]` | 所有可选精灵名称列表 |
  | `onExport` | `() => void` | 导出按钮回调 |
- **状态订阅**：
  | 字段 | 来源 |
  |------|------|
  | `winner` | `useBattleStore(s => s.winner)` |
  | `team1` | `useBattleStore(s => s.team1)` |
  | `team2` | `useBattleStore(s => s.team2)` |
  | `setWinner` | `useBattleStore(s => s.setWinner)` |
  | `setTeam` | `useBattleStore(s => s.setTeam)` |
- **UI 依赖**：`Card`, `Form.Item`, `Select`, `Button`

---

### 2.3 RoundNavigation.tsx

- **职责**：回合标签页导航 + 回合管理按钮 + 左右两侧玩家面板布局
- **Props**：
  | 属性 | 类型 | 说明 |
  |------|------|------|
  | `skillList` | `string[]` | 所有可选技能名称列表 |
  | `onAddRound` | `() => void` | 添加回合回调 |
  | `onDeleteRound` | `() => void` | 删除回合回调 |
  | `onDeleteAllRounds` | `() => void` | 删除全部回合回调 |
- **状态订阅**：
  | 字段 | 来源 |
  |------|------|
  | `rounds` | `useBattleStore(s => s.rounds)` |
  | `currentRoundIndex` | `useBattleStore(s => s.currentRoundIndex)` |
  | `navigateRound` | `useBattleStore(s => s.navigateRound)` |
- **UI 依赖**：`Card`, `Tabs`, `Button`, `Popconfirm`, `Row`, `Col`

---

### 2.4 PlayerPanel.tsx

- **职责**：单个玩家的完整操作面板（场上精灵选择、精灵状态、增益减益、行动选择）
- **Props**：
  | 属性 | 类型 | 说明 |
  |------|------|------|
  | `playerNum` | `number` | 玩家编号 (1 或 2) |
  | `skillList` | `string[]` | 所有可选技能名称列表 |
- **状态订阅**：
  | 字段 | 来源 |
  |------|------|
  | `team` | `useBattleStore(s => playerNum === 1 ? s.team1 : s.team2)` |
  | `playerState` | `useBattleStore(s => s.rounds[s.currentRoundIndex][playerKey])` |
  | `updateActivePet` | `useBattleStore(s => s.updateActivePet)` |
  | `updatePetState` | `useBattleStore(s => s.updatePetState)` |
  | `updateBuff` | `useBattleStore(s => s.updateBuff)` |
  | `clearAllBuffs` | `useBattleStore(s => s.clearAllBuffs)` |
  | `updateAction` | `useBattleStore(s => s.updateAction)` |
- **UI 依赖**：`Card`, `Form.Item`, `Select`, `Row`, `Col`, `NumberInput`

---

### 2.5 PetDetailCard.tsx

- **职责**：在场精灵的 HP/能量编辑卡片（含当前标签）
- **Props**：
  | 属性 | 类型 | 说明 |
  |------|------|------|
  | `pet` | `PetState` | 精灵状态数据 |
  | `petIndex` | `number` | 精灵在阵容中的索引 |
  | `playerKey` | `string` | 玩家键 (`player_1` / `player_2`) |
  | `playerNum` | `number` | 玩家编号 |
  | `isActive` | `boolean` | 是否为当前场上精灵 |
  | `onSetActive` | `(playerKey, petName) => void` | 设为场上精灵回调 |
  | `onUpdatePet` | `(playerKey, petIndex, field, value) => void` | 更新精灵状态回调 |
- **状态订阅**：无（纯展示组件，通过 props 接收）
- **UI 依赖**：`Card`, `Slider`, `Tag`, `Row`, `Col`, `NumberInput`, `EnergyBlocks`

---

### 2.6 BenchPetButton.tsx

- **职责**：替补精灵按钮 + 悬浮弹出编辑卡片
- **Props**：同 `PetDetailCardProps` 去掉 `isActive`
- **内部状态**：`showPopup` (useState) — 控制悬浮弹出层显隐
- **状态订阅**：无（纯展示组件）
- **UI 依赖**：`Button`, `Card`, `Slider`, `NumberInput`, `EnergyBlocks`

---

### 2.7 EnergyBlocks.tsx

- **职责**：能量块可视化组件，10 个小方块
- **Props**：
  | 属性 | 类型 | 说明 |
  |------|------|------|
  | `value` | `number` | 当前能量值 (0~10) |
  | `onChange` | `(value: number) => void` | 能量值变更回调 |
  | `playerNum` | `number` | 玩家编号（配色） |
- **内部状态**：`hoverMp`, `isContainerHovered` (useState)
- **交互**：单击方块设置能量值 (= index+1)，双击整体清零
- **UI 依赖**：`Tooltip`

---

### 2.8 NumberInput.tsx

- **职责**：通用数字输入器（按钮 + InputNumber）
- **Props**：
  | 属性 | 类型 | 默认值 | 说明 |
  |------|------|--------|------|
  | `value` | `number` | — | 当前值 |
  | `onChange` | `(value: number) => void` | — | 变更回调 |
  | `min` | `number` | `0` | 最小值 |
  | `max` | `number` | `100` | 最大值 |
  | `step` | `number` | `1` | 步长 |
  | `precision` | `number` | — | 小数精度 |
  | `width` | `number` | `320` | 组件宽度 |
  | `showClear` | `boolean` | `false` | 是否显示清空按钮 |
  | `showStep10` | `boolean` | `false` | 是否显示 ±10 按钮 |
- **UI 依赖**：`Button`, `InputNumber`, `Space.Compact`

---

## 三、Props 传递示意图（迁移前后对比）

### 迁移前（Prop Drilling）

```
App.tsx
  │  rounds, currentRoundIndex, setCurrentRoundIndex,
  │  syncTeamToRound, addRound, deleteRound, deleteAllRounds,
  │  updatePetState, updateActivePet, updateBuff,
  │  clearAllBuffs, updateAction, importBattleData,
  │  winner, team1, team2
  │
  ├─► BasicInfo         ← 7 props (winner, team1, team2, ...)
  │
  └─► RoundNavigation   ← 17 props (rounds, currentRoundIndex, ...)
        │
        ├─► PlayerPanel [1]  ← 11 props (team, playerState, onUpdate...)
        │     ├─► PetDetailCard    ← 7 props
        │     └─► BenchPetButton   ← 6 props
        │
        └─► PlayerPanel [2]  ← 11 props (同上)
```

### 迁移后（zustand 直接订阅）

```
App.tsx
  │  winner(订阅), rounds(订阅), team1(订阅), team2(订阅), currentRoundIndex(订阅)
  │  handleAddRound(getState), handleDeleteRound(getState), ... 
  │
  ├─► BasicInfo         ← 2 props   (pokemonList, onExport)
  │     ├─ winner       ← store 订阅
  │     ├─ team1/team2  ← store 订阅
  │     └─ setWinner/setTeam ← store 订阅
  │
  └─► RoundNavigation   ← 4 props   (skillList, onAdd/Delete/DeleteAll)
        ├─ rounds/currentRoundIndex ← store 订阅
        ├─ navigateRound ← store 订阅
        │
        ├─► PlayerPanel [1]  ← 2 props (playerNum, skillList)
        │     ├─ team/playerState/actions ← store 订阅
        │     ├─ PetDetailCard    ← 7 props（纯展示，合理）
        │     └─ BenchPetButton   ← 6 props（纯展示，合理）
        │
        └─► PlayerPanel [2]  ← 2 props (同上)
```
