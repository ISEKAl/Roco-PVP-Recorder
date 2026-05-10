# 数据流文档

---

## 一、状态写入流

```
用户操作                    → 组件                    → Store Action        → 状态变更
─────────────────────────────────────────────────────────────────────────────────
选择胜利方                  BasicInfo.Select         setWinner             winner
选择/修改阵容               BasicInfo.Select         setTeam               team1/team2 + rounds[X].pets
导航回合                    RoundNavigation.Tabs      navigateRound         currentRoundIndex
添加回合                    RoundNavigation.Button    addRound（App.tsx）    rounds[], currentRoundIndex
删除回合                    RoundNavigation.Button    deleteRound（App.tsx） rounds[], currentRoundIndex
删除全部                    RoundNavigation.Button    deleteAllRounds（App.tsx） rounds[], currentRoundIndex
切换场上精灵                PlayerPanel.Select        updateActivePet       rounds[X].active_pet, buff
调节 HP                     PetDetailCard.Slider      updatePetState        rounds[X].pets[i].hp_ratio
调节能量                    EnergyBlocks.Click        updatePetState        rounds[X].pets[i].mp
调节增益减益                PlayerPanel.NumberInput   updateBuff            rounds[X].buff[key]
清空增益减益                PlayerPanel.Button        clearAllBuffs         rounds[X].buff
选择行动类型                PlayerPanel.Select        updateAction          rounds[X].action.type
选择技能名                  PlayerPanel.Select        updateAction          rounds[X].action.skill_name
选择换宠目标                PlayerPanel.Select        updateAction          rounds[X].action.to
导出 JSON                   BasicInfo.Button          导出工具函数          文件系统
导入 JSON                   App.tsx(菜单)              importBattleData      rounds[], team1, team2, winner
```

---

## 二、关键操作数据流详解

### 2.1 阵容选择 → 回合同步

```
用户选择精灵 (BasicInfo.tsx)
  │
  ▼
setTeam(playerNum, selectedNames)
  │ 存储 team1/team2
  │ 同时更新当前回合 rounds[currentRoundIndex]
  │
  ├── 第 1 回合：重置 pets 为默认状态 (hp=1, mp=10)
  ├── 其他回合：pets 从上一回合继承（浅拷贝）
  └── 如果无场上精灵：自动设置第一只为 active_pet
```

### 2.2 切换场上精灵

```
用户选择新精灵 (PlayerPanel.tsx)
  │
  ▼
updateActivePet(playerKey, petName)
  │
  ├── rounds[X].active_pet = petName
  └── rounds[X].buff = resetBuff()   // 换宠重置增益减益
```

### 2.3 添加回合 → 状态继承

```
用户点击「添加回合」
  │
  ▼
addRound()
  │
  ├── 读最后一回合 (prevRounds[last])
  │
  ├── 决定场上精灵：
  │   ├── 上回合是 switch → 用 action.to
  │   └── 否则 → 继承 active_pet
  │
  ├── 决定 buff：
  │   ├── 上回合有 switch → createDefaultBuff()
  │   └── 否则 → 浅拷贝上回合 buff
  │
  ├── pets：浅拷贝上回合 pets
  │
  ├── 追加新回合到 rounds[]
  └── currentRoundIndex = rounds.length
```

### 2.4 导出 JSON

```
用户点击「导出 JSON」
  │
  ▼
handleExport() (App.tsx)
  │
  ▼
exportBattleJSON({ winner, rounds, team1, team2 })
  │
  ├── 校验：winner 必须有值，阵容不能为空
  ├── 构建 BattleExportData：
  │     { time, winner, total_round, team_1, team_2, round }
  │
  ├── Electron 环境：window.electronAPI.saveFile(jsonString)
  │     └── Main: dialog.showSaveDialog() → fs.writeFile()
  │
  └── 浏览器环境：downloadInBrowser(jsonString)
        └── Blob → URL.createObjectURL → <a>.click()
```

### 2.5 导入 JSON

```
用户菜单 → 导入 / 快捷键 Ctrl+O
  │
  ▼
Main Process: 发送 menu-action 'import'
  │
  ▼
App.tsx useEffect: onMenuAction('import')
  │
  ▼
handleImport() (App.tsx)
  │
  ▼
window.electronAPI.openFile()
  │
  ▼
Main Process: dialog.showOpenDialog() → fs.readFile()
  │  返回 { success, data: BattleExportData }
  │
  ▼
校验：data.winner, data.round, data.team_1, data.team_2 必须有值
  │
  ▼
store.setWinner(data.winner)
store.importBattleData(data.round)
  │ 内部自动设置：rounds, currentRoundIndex=0, team1, team2
```

---

## 三、渲染订阅流

```
battleStore 状态变更
  │
  ├── winner 变更
  │   └── BasicInfo (Select 显示) 重渲染
  │       App.tsx (导出用 getState 读，不重渲染)
  │
  ├── team1 / team2 变更
  │   ├── BasicInfo (Select 显示) 重渲染
  │   └── PlayerPanel (playerNum=1: team1, playerNum=2: team2) 重渲染
  │
  ├── rounds 变更
  │   ├── RoundNavigation (Tabs 标签页) 重渲染
  │   ├── PlayerPanel (playerState) 重渲染
  │   │   └── PetDetailCard / BenchPetButton (props 变化) 重渲染
  │   └── App.tsx (导出用) 重渲染
  │
  ├── currentRoundIndex 变更
  │   ├── RoundNavigation (Tabs activeKey, 按钮 disabled) 重渲染
  │   └── PlayerPanel (玩家状态切换到新回合) 重渲染
  │
  └── actions (setWinner, setTeam, updateXXX...)
      └── 函数引用不变 → 不会触发任何组件重渲染
```

---

## 四、不可变更新模式

所有状态更新均采用不可变方式，确保 zustand 的引用比较正常工作：

```typescript
// 更新嵌套对象的标准模式
set((prev) => {
  const newRounds = [...prev.rounds];            // 浅拷贝外层数组
  const round = { ...newRounds[index] };          // 浅拷贝目标回合
  round.player = {
    ...round.player,                              // 浅拷贝玩家
    field: newValue,                              // 更新目标字段
  };
  newRounds[index] = round;                       // 放回数组
  return { rounds: newRounds };
});
```

---

## 五、Electron IPC 数据流

```
Renderer (React)          Preload (Bridge)         Main (Node.js)
─────────────────────────────────────────────────────────────────
导出：
  exportBattleJSON()
    → electronAPI.saveFile(json)
      → ipcRenderer.invoke('save-file', json)
        → ipcMain.handle('save-file')
          → dialog.showSaveDialog()
          → fs.writeFile()
          → return { success, message }

导入：
  handleImport()
    → electronAPI.openFile()
      → ipcRenderer.invoke('open-file')
        → ipcMain.handle('open-file')
          → dialog.showOpenDialog()
          → fs.readFile() → JSON.parse
          → return { success, data }

菜单事件：
  Main: menu click
    → mainWindow.webContents.send('menu-action', action)
      → preload: ipcRenderer.on('menu-action', callback)
        → Renderer: callback(action)
```

---

## 六、console 数据验证

可以在 DevTools Console 中执行以下命令快速检查 store 状态：

```javascript
// 获取所有状态快照
__ZUSTAND_DEVTOOLS__  // zustand v5 自动挂载（开发环境）

// 通过 import 获取
// （如果 store 暴露了全局引用）
```
