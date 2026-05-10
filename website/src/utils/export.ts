import type { BattleExportData, ExportResult } from '../types';

interface ExportOptions {
  winner: number | null;
  rounds: BattleExportData['round'];
  team1: string[];
  team2: string[];
}

// 导出对局数据为 JSON 文件
export const exportBattleJSON = (data: ExportOptions): ExportResult => {
  const { winner, rounds, team1, team2 } = data;

  if (!winner) {
    return { success: false, message: '请选择胜利方' };
  }

  if (team1.length === 0 || team2.length === 0) {
    return { success: false, message: '请选择双方阵容' };
  }

  const battleData: BattleExportData = {
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

  const blob = new Blob([JSON.stringify(battleData, null, 4)], {
    type: 'application/json',
  });
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

  return { success: true, message: '对局数据导出成功！' };
};