import React, { useState, useCallback } from 'react';
import { Layout, Form, message } from 'antd';
import pokemonData from './config/pokemon.json';
import skillsData from './config/skills.json';
import { useRounds } from './hooks/useRounds';
import { exportBattleJSON } from './utils/export';
import AppHeader from './components/AppHeader';
import BasicInfo from './components/BasicInfo';
import RoundNavigation from './components/RoundNavigation';
import type { PokemonConfig, SkillConfig } from './types';

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
  const handleExport = useCallback(() => {
    const result = exportBattleJSON({ winner, rounds, team1, team2 });
    if (result.success) {
      message.success(result.message);
    } else {
      message.error(result.message);
    }
  }, [winner, rounds, team1, team2]);

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