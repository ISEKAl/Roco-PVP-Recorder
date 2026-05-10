import React, { useCallback, useEffect } from 'react';
import { Layout, Form, message } from 'antd';
import pokemonData from './config/pokemon.json';
import skillsData from './config/skills.json';
import { useBattleStore } from './stores/battleStore';
import { exportBattleJSON } from './utils/export';
import AppHeader from './components/AppHeader';
import BasicInfo from './components/BasicInfo';
import RoundNavigation from './components/RoundNavigation';
import type { PokemonConfig, SkillConfig, RoundData, BattleExportData } from './types';

const { Content } = Layout;

const App: React.FC = () => {
  const [form] = Form.useForm();

  const winner = useBattleStore((s) => s.winner);
  const rounds = useBattleStore((s) => s.rounds);
  const team1 = useBattleStore((s) => s.team1);
  const team2 = useBattleStore((s) => s.team2);
  const currentRoundIndex = useBattleStore((s) => s.currentRoundIndex);

  const pokemonList = (pokemonData as PokemonConfig[]).map((p) => p.name);
  const skillList = (skillsData as SkillConfig[]).map((s) => s.name);

  // 添加回合
  const handleAddRound = useCallback(() => {
    const store = useBattleStore.getState();
    store.addRound();
    message.success(`已添加第 ${store.rounds.length} 回合`);
  }, []);

  // 删除回合
  const handleDeleteRound = useCallback(() => {
    const result = useBattleStore.getState().deleteRound();
    if (result.success) {
      message.success(result.message);
    } else {
      message.warning(result.message);
    }
  }, []);

  // 删除全部回合
  const handleDeleteAllRounds = useCallback(() => {
    useBattleStore.getState().deleteAllRounds();
    message.success('已删除全部回合并重置！');
  }, []);

  // 导出 JSON
  const handleExport = useCallback(async () => {
    const state = useBattleStore.getState();
    const result = await exportBattleJSON({
      winner: state.winner,
      rounds: state.rounds,
      team1: state.team1,
      team2: state.team2,
    });
    if (result.success) {
      message.success(result.message);
    } else {
      message.error(result.message);
    }
  }, []);

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
      const store = useBattleStore.getState();
      store.setWinner(data.winner);
      store.importBattleData(data.round as RoundData[]);

      message.success(`成功导入对局数据！共 ${data.round.length} 回合`);
    } catch {
      message.error('文件解析失败，请检查文件格式');
    }
  }, []);

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
            pokemonList={pokemonList}
            onExport={handleExport}
          />

          <RoundNavigation
            skillList={skillList}
            onAddRound={handleAddRound}
            onDeleteRound={handleDeleteRound}
            onDeleteAllRounds={handleDeleteAllRounds}
          />
        </Form>
      </Content>
    </Layout>
  );
};

export default App;
