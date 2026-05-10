import type { BattleExportData, ExportResult } from '../types';

interface ExportOptions {
  winner: number | null;
  rounds: BattleExportData['round'];
  team1: string[];
  team2: string[];
}

// 构建对局导出数据
const buildBattleData = (data: ExportOptions): BattleExportData | null => {
  const { winner, rounds, team1, team2 } = data;

  if (!winner) return null;
  if (team1.length === 0 || team2.length === 0) return null;

  return {
    time: new Date().toISOString(),
    winner,
    total_round: rounds.length,
    team_1: team1,
    team_2: team2,
    round: rounds.map((r) => ({
      cur_round: r.cur_round,
      player_1: r.player_1,
      player_2: r.player_2,
    })),
  };
};

// 浏览器环境下载 JSON
const downloadInBrowser = (jsonString: string): void => {
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  a.download = `battle_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.json`;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// 异步导出对局数据（Electron 原生保存对话框 / 浏览器下载）
export const exportBattleJSON = async (data: ExportOptions): Promise<ExportResult> => {
  const { winner, team1, team2 } = data;

  if (!winner) {
    return { success: false, message: '请选择胜利方' };
  }

  if (team1.length === 0 || team2.length === 0) {
    return { success: false, message: '请选择双方阵容' };
  }

  const battleData = buildBattleData(data);
  if (!battleData) {
    return { success: false, message: '数据构建失败' };
  }

  const jsonString = JSON.stringify(battleData, null, 4);

  // Electron 环境：使用原生保存对话框
  if (window.electronAPI) {
    const result = await window.electronAPI.saveFile(jsonString);
    if (result.success) {
      return { success: true, message: '对局数据导出成功！' };
    }
    return { success: false, message: result.message };
  }

  // 浏览器环境：触发下载
  downloadInBrowser(jsonString);
  return { success: true, message: '对局数据导出成功！' };
};