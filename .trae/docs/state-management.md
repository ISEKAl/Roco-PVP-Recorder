# 状态管理文档

> zustand 统一状态管理方案
> 迁移时间：2026-05-10

---

## 一、迁移历史

| 阶段 | 方案 | 说明 |
|------|------|------|
| v1（迁移前） | `useState` + `useRounds()` 自定义 Hook | `winner/team1/team2` 在 App.tsx；`rounds/currentRoundIndex` 在 useRounds.ts，通过 props 层层传递（Prop Drilling，最深 4 层） |
| v2（当前） | zustand v5 | 统一 `src/stores/battleStore.ts`，各组件按需订阅，消除 Prop Drilling 和 stale closure 问题 |

---

## 二、Store 结构

文件：[battleStore.ts](file:///d:/Code/Python/RocoPVP/website/src/stores/battleStore.ts)

### 2.1 状态（State）

```typescript
interface BattleState {
  winner: number | null;         // 胜利方 (1 或 2)
  team1: string[];               // 玩家1 阵容
  team2: string[];               // 玩家2 阵容
  rounds: RoundData[];           // 回合数据数组
  currentRoundIndex: number;     // 当前回合索引
}
```

### 2.2 操作（Actions）

| 方法 | 签名 | 说明 |
|------|------|------|
| `setWinner` | `(winner: number \| null) => void` | 设置胜利方 |
| `setTeam` | `(playerNum: number, team: string[]) => void` | 设置阵容并同步到当前回合 |
| `navigateRound` | `(index: number) => void` | 导航到指定回合 |
| `addRound` | `() => void` | 添加新回合（继承上回合状态，自动前进） |
| `deleteRound` | `() => OperationResult` | 删除最后一个回合（至少保留 1 个） |
| `deleteAllRounds` | `() => OperationResult` | 删除全部回合并重置 |
| `updatePetState` | `(playerKey, petIndex, field, value) => void` | 更新精灵状态（HP/能量） |
| `updateActivePet` | `(playerKey, petName) => void` | 更新场上精灵（同时重置 buff） |
| `updateBuff` | `(playerKey, field, value) => void` | 更新增益减益数值 |
| `clearAllBuffs` | `(playerKey) => void` | 清空所有增益减益 |
| `updateAction` | `(playerKey, action) => void` | 更新行动（技能/换宠） |
| `importBattleData` | `(importedRounds: RoundData[]) => { team1, team2 }` | 导入对局数据 |

---

## 三、使用模式

### 3.1 组件内订阅（自动重渲染）

```typescript
// 订阅单个字段（浅比较）
const winner = useBattleStore((s) => s.winner);

// 订阅多个字段（每次重渲染都会检查，建议拆成多个调用）
const team1 = useBattleStore((s) => s.team1);
const team2 = useBattleStore((s) => s.team2);

// 订阅 action（函数引用不变，不会触发无效渲染）
const setWinner = useBattleStore((s) => s.setWinner);
const updatePetState = useBattleStore((s) => s.updatePetState);
```

### 3.2 组件外调用（不引起渲染）

```typescript
// 在 useCallback / 事件处理中，使用 getState() 获取最新快照
const handleAddRound = useCallback(() => {
  const store = useBattleStore.getState();
  store.addRound();
  message.success(`已添加第 ${store.rounds.length} 回合`);
}, []); // 依赖数组为空，引用稳定
```

### 3.3 `set(prev => ...)` 模式

所有更新操作均使用 zustand 的函数式更新，自动获取最新状态，避免 stale closure：

```typescript
updatePetState: (playerKey, petIndex, field, value) => {
  set((prev) => {
    const newRounds = [...prev.rounds];
    const round = { ...newRounds[prev.currentRoundIndex] };
    // ... 不可变更新
    return { rounds: newRounds };
  });
},
```

---

## 四、订阅分布

| 组件 | 订阅的状态 | 订阅的 actions |
|------|-----------|---------------|
| `App.tsx` | `winner`, `rounds`, `team1`, `team2`, `currentRoundIndex` | （通过 `getState()` 调用） |
| `BasicInfo.tsx` | `winner`, `team1`, `team2` | `setWinner`, `setTeam` |
| `RoundNavigation.tsx` | `rounds`, `currentRoundIndex` | `navigateRound` |
| `PlayerPanel.tsx` | `team1/team2`, `rounds[currentRoundIndex].player_X` | `updateActivePet`, `updatePetState`, `updateBuff`, `clearAllBuffs`, `updateAction` |
| `PetDetailCard.tsx` | —（纯展示组件，通过 props） | —（通过 props 回调） |
| `BenchPetButton.tsx` | —（纯展示组件，通过 props） | —（通过 props 回调） |

### 关键设计决策

1. **PetDetailCard 和 BenchPetButton 不走 store**：它们只负责展示和转发用户输入，保持纯组件特性，便于复用和测试
2. **App.tsx 中 action 调用使用 `getState()`**：避免将 action 放入依赖数组导致回调重建
3. **PlayerPanel 直接订阅 playerState**：`useBattleStore(s => s.rounds[s.currentRoundIndex][playerKey])` 精确订阅当前回合的玩家状态，其他回合变化不触发此组件重渲染

---

## 五、回合管理逻辑要点

### 添加回合 (`addRound`)

1. 取最后一回合 (`prev.rounds[prev.rounds.length - 1]`)
2. 判断上回合行动：如果有 `switch` 行动 → 场上精灵切换为换宠目标
3. 如果有 `switch` 行动 → buff 重置为默认值
4. 精灵 HP/能量 从上一回合继承（浅拷贝）
5. 追加新回合到数组末尾，同时设置 `currentRoundIndex = rounds.length`

### 阵容同步 (`setTeam`)

1. 第 1 回合影集：重置该玩家所有精灵状态为默认
2. 其他回合：从上一回合继承精灵状态
3. 如果当前无场上精灵且阵容非空 → 自动设置第一只为场上精灵

### 导入对局 (`importBattleData`)

1. 完整替换 `rounds` 数组
2. 从首回合提取 `team1`/`team2`
3. 设置 `currentRoundIndex = 0`
4. 由调用方额外设置 `winner` 和格式校验
