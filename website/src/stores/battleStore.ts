import { create } from 'zustand';
import { DEFAULT_PET_STATE } from '../constants';
import { createDefaultBuff, resetBuff } from '../utils/buff';
import type { RoundData, Action, OperationResult } from '../types';

// 创建初始回合数据
const createInitialRound = (team1: string[] = [], team2: string[] = []): RoundData => ({
  cur_round: 1,
  player_1: {
    active_pet: team1.length > 0 ? team1[0] : '',
    pets: team1.map((name) => DEFAULT_PET_STATE(name)),
    buff: createDefaultBuff(),
    action: null,
  },
  player_2: {
    active_pet: team2.length > 0 ? team2[0] : '',
    pets: team2.map((name) => DEFAULT_PET_STATE(name)),
    buff: createDefaultBuff(),
    action: null,
  },
});

// 状态类型
interface BattleState {
  winner: number | null;
  team1: string[];
  team2: string[];
  rounds: RoundData[];
  currentRoundIndex: number;
}

// 操作类型
interface BattleActions {
  setWinner: (winner: number | null) => void;
  setTeam: (playerNum: number, team: string[]) => void;
  navigateRound: (index: number) => void;
  addRound: () => void;
  deleteRound: () => OperationResult;
  deleteAllRounds: () => OperationResult;
  updatePetState: (playerKey: string, petIndex: number, field: string, value: number) => void;
  updateActivePet: (playerKey: string, petName: string) => void;
  updateBuff: (playerKey: string, field: string, value: number) => void;
  clearAllBuffs: (playerKey: string) => void;
  updateAction: (playerKey: string, action: Action) => void;
  importBattleData: (importedRounds: RoundData[]) => { team1: string[]; team2: string[] };
}

export const useBattleStore = create<BattleState & BattleActions>()((set, get) => ({
  // 初始状态
  winner: null,
  team1: [],
  team2: [],
  rounds: [createInitialRound()],
  currentRoundIndex: 0,

  // 设置胜利方
  setWinner: (winner) => set({ winner }),

  // 设置阵容并同步到当前回合
  setTeam: (playerNum, team) => {
    const playerKey = `player_${playerNum}` as 'player_1' | 'player_2';

    set((prev) => {
      const newRounds = [...prev.rounds];
      const round = { ...newRounds[prev.currentRoundIndex] };

      if (round.cur_round === 1) {
        round[playerKey] = {
          ...round[playerKey],
          pets: team.map((name) => DEFAULT_PET_STATE(name)),
        };
      } else {
        round[playerKey] = {
          ...round[playerKey],
          pets: prev.rounds[prev.currentRoundIndex - 1][playerKey].pets.map((p) => ({ ...p })),
        };
      }

      if (team.length > 0 && !round[playerKey].active_pet) {
        round[playerKey] = {
          ...round[playerKey],
          active_pet: team[0],
        };
      }

      newRounds[prev.currentRoundIndex] = round;

      return {
        rounds: newRounds,
        ...(playerNum === 1 ? { team1: team } : { team2: team }),
      };
    });
  },

  // 导航到指定回合
  navigateRound: (index) => set({ currentRoundIndex: index }),

  // 添加新回合
  addRound: () => {
    set((prev) => {
      const prevRound = prev.rounds[prev.rounds.length - 1];

      const getNextActivePet = (playerKey: 'player_1' | 'player_2'): string => {
        const switched = prevRound[playerKey].action?.type === 'switch' && prevRound[playerKey].action?.to;
        return switched ? prevRound[playerKey].action!.to! : prevRound[playerKey].active_pet;
      };

      const player1ActivePet = getNextActivePet('player_1');
      const player2ActivePet = getNextActivePet('player_2');

      const player1Switched = prevRound.player_1.action?.type === 'switch' && !!prevRound.player_1.action.to;
      const player2Switched = prevRound.player_2.action?.type === 'switch' && !!prevRound.player_2.action.to;

      const newRound: RoundData = {
        cur_round: prevRound.cur_round + 1,
        player_1: {
          active_pet: player1ActivePet,
          pets: prevRound.player_1.pets.map((p) => ({ ...p })),
          buff: player1Switched ? createDefaultBuff() : { ...prevRound.player_1.buff },
          action: null,
        },
        player_2: {
          active_pet: player2ActivePet,
          pets: prevRound.player_2.pets.map((p) => ({ ...p })),
          buff: player2Switched ? createDefaultBuff() : { ...prevRound.player_2.buff },
          action: null,
        },
      };

      return {
        rounds: [...prev.rounds, newRound],
        currentRoundIndex: prev.rounds.length,
      };
    });
  },

  // 删除最后一个回合
  deleteRound: () => {
    const { rounds } = get();
    if (rounds.length <= 1) {
      return { success: false, message: '至少需要保留1回合' };
    }

    set({
      rounds: rounds.slice(0, -1),
      currentRoundIndex: rounds.length - 2,
    });

    return { success: true, message: `已删除第 ${rounds.length} 回合` };
  },

  // 删除全部回合并重置
  deleteAllRounds: () => {
    set((prev) => {
      const firstRound = prev.rounds[0];
      return {
        rounds: [{
          cur_round: 1,
          player_1: {
            active_pet: '',
            pets: firstRound.player_1.pets.map((p) => ({ ...DEFAULT_PET_STATE(p.name) })),
            buff: createDefaultBuff(),
            action: null,
          },
          player_2: {
            active_pet: '',
            pets: firstRound.player_2.pets.map((p) => ({ ...DEFAULT_PET_STATE(p.name) })),
            buff: createDefaultBuff(),
            action: null,
          },
        }],
        currentRoundIndex: 0,
      };
    });

    return { success: true, message: '已删除全部回合并重置！' };
  },

  // 更新精灵状态
  updatePetState: (playerKey, petIndex, field, value) => {
    set((prev) => {
      const newRounds = [...prev.rounds];
      const round = { ...newRounds[prev.currentRoundIndex] };
      const pk = playerKey as 'player_1' | 'player_2';
      if (round[pk].pets[petIndex]) {
        const pets = [...round[pk].pets];
        pets[petIndex] = { ...pets[petIndex], [field]: value };
        round[pk] = { ...round[pk], pets };
        newRounds[prev.currentRoundIndex] = round;
      }
      return { rounds: newRounds };
    });
  },

  // 更新场上精灵
  updateActivePet: (playerKey, petName) => {
    set((prev) => {
      const newRounds = [...prev.rounds];
      const round = { ...newRounds[prev.currentRoundIndex] };
      const pk = playerKey as 'player_1' | 'player_2';
      round[pk] = {
        ...round[pk],
        active_pet: petName,
        buff: resetBuff(),
      };
      newRounds[prev.currentRoundIndex] = round;
      return { rounds: newRounds };
    });
  },

  // 更新增益减益
  updateBuff: (playerKey, field, value) => {
    set((prev) => {
      const newRounds = [...prev.rounds];
      const round = { ...newRounds[prev.currentRoundIndex] };
      const pk = playerKey as 'player_1' | 'player_2';
      round[pk] = {
        ...round[pk],
        buff: { ...round[pk].buff, [field]: value },
      };
      newRounds[prev.currentRoundIndex] = round;
      return { rounds: newRounds };
    });
  },

  // 清空所有增益减益
  clearAllBuffs: (playerKey) => {
    set((prev) => {
      const newRounds = [...prev.rounds];
      const round = { ...newRounds[prev.currentRoundIndex] };
      const pk = playerKey as 'player_1' | 'player_2';
      round[pk] = {
        ...round[pk],
        buff: resetBuff(),
      };
      newRounds[prev.currentRoundIndex] = round;
      return { rounds: newRounds };
    });
  },

  // 更新行动
  updateAction: (playerKey, action) => {
    set((prev) => {
      const newRounds = [...prev.rounds];
      const round = { ...newRounds[prev.currentRoundIndex] };
      const pk = playerKey as 'player_1' | 'player_2';
      round[pk] = { ...round[pk], action };
      newRounds[prev.currentRoundIndex] = round;
      return { rounds: newRounds };
    });
  },

  // 导入对局数据
  importBattleData: (importedRounds) => {
    const firstRound = importedRounds[0];
    const team1 = firstRound.player_1.pets.map((p) => p.name);
    const team2 = firstRound.player_2.pets.map((p) => p.name);

    set({
      rounds: importedRounds,
      currentRoundIndex: 0,
      team1,
      team2,
    });

    return { team1, team2 };
  },
}));
