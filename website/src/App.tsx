import React, { useState, useCallback, useEffect } from 'react';
import { Layout, Form, message } from 'antd';
import pokemonData from './config/pokemon.json';
import skillsData from './config/skills.json';
import { useRounds } from './hooks/useRounds';
import { exportBattleJSON } from './utils/export';
import AppHeader from './components/AppHeader';
import BasicInfo from './components/BasicInfo';
import RoundNavigation from './components/RoundNavigation';
import type { PokemonConfig, SkillConfig, RoundData, BattleExportData } from './types';

const { Content } = Layout;

const App: React.FC = () => {
  const [form] = Form.useForm();
  const [winner, setWinner] = useState<number | null>(null);
  const [team1, setTeam1] = useState<string[]>([]);
  const [team2, setTeam2] = useState<string[]>([]);

  const {
    rounds,
    currentRoundIndex,
    setCurrentRoundIndex,
    syncTeamToRound,
    addRound,
    deleteRound,
    deleteAllRounds,
    updatePetState,
    updateActivePet,
    updateBuff,
    clearAllBuffs,
    updateAction,
    importBattleData,
  } = useRounds();

  const pokemonList = (pokemonData as PokemonConfig[]).map((p) => p.name);
  const skillList = (skillsData as SkillConfig[]).map((s) => s.name);

  // 阵容变更处理
  const handleTeamChange = useCallback((playerNum: number, team: string[]) => {
    if (playerNum === 1) {
      setTeam1(team);
    } else {
      setTeam2(team);
    }
    syncTeamToRound(playerNum, team);
  }, [syncTeamToRound]);

  // 添加回合
  const handleAddRound = useCallback(() => {
    addRound();
    message.success(`已添加第 ${rounds.length + 1} 回合`);
  }, [addRound, rounds.length]);

  // 删除回合
  const handleDeleteRound = useCallback(() => {
    const result = deleteRound();
    if (result.success) {
      message.success(result.message);
    } else {
      message.warning(result.message);
    }
  }, [deleteRound]);

  // 删除全部回合
  const handleDeleteAllRounds = useCallback(() => {
    deleteAllRounds();
    message.success('已删除全部回合并重置！');
  }, [deleteAllRounds]);

  // 导出 JSON
  const handleExport = useCallback(async () => {
    const result = await exportBattleJSON({ winner, rounds, team1, team2 });
    if (result.success) {
      message.success(result.message);
    } else {
      message.error(result.message);
    }
  }, [winner, rounds, team1, team2]);

  // 导入 JSON
  const handleImport = useCallback(async () => {
    if (!window.electronAPI) {
      message.warning('导入功能仅在桌面应用中可用');
      return;
    }

    const result = await window.electronAPI.openFile();
    if (!result.success || !result.data) {
      if (result.message && result.message !== '用户取消导入') {
        message.error(result.message || '导入失败');
      }
      return;
    }

    try {
      const data = result.data as BattleExportData;

      if (!data.winner || !data.round || !data.team_1 || !data.team_2) {
        message.error('文件格式不正确');
        return;
      }

      // 回填对局数据
      setWinner(data.winner);
      setTeam1(data.team_1);
      setTeam2(data.team_2);

      const teams = importBattleData(data.round as RoundData[]);
      // importBattleData 内部已设置 rounds，这里同步 teams
      setTeam1(teams.team1);
      setTeam2(teams.team2);

      message.success(`成功导入对局数据！共 ${data.round.length} 回合`);
    } catch {
      message.error('文件解析失败，请检查文件格式');
    }
  }, [importBattleData]);

  // 监听原生菜单事件
  useEffect(() => {
    if (!window.electronAPI) return;

    const unsubscribe = window.electronAPI.onMenuAction((action: string) => {
      switch (action) {
        case 'export':
          handleExport();
          break;
        case 'import':
          handleImport();
          break;
        case 'about':
          message.info('洛克王国PVP对局录入工具 v1.0.0');
          break;
      }
    });

    return unsubscribe;
  }, [handleExport, handleImport]);

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <AppHeader />

      <Content style={{ padding: '24px' }}>
        <Form form={form} layout="vertical">
          <BasicInfo
            winner={winner}
            onWinnerChange={setWinner}
            team1={team1}
            team2={team2}
            onTeamChange={handleTeamChange}
            pokemonList={pokemonList}
            onExport={handleExport}
          />

          <RoundNavigation
            rounds={rounds}
            currentRoundIndex={currentRoundIndex}
            onNavigate={setCurrentRoundIndex}
            onAddRound={handleAddRound}
            onDeleteRound={handleDeleteRound}
            onDeleteAllRounds={handleDeleteAllRounds}
            team1={team1}
            team2={team2}
            skillList={skillList}
            onUpdateActivePet={updateActivePet}
            onUpdatePetState={updatePetState}
            onUpdateBuff={updateBuff}
            onClearAllBuffs={clearAllBuffs}
            onUpdateAction={updateAction}
          />
        </Form>
      </Content>
    </Layout>
  );
};

export default App;