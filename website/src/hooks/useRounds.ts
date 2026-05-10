import { useState, useCallback } from 'react';
import { DEFAULT_PET_STATE } from '../constants';
import { createDefaultBuff, resetBuff } from '../utils/buff';
import buffsConfig from '../config/buffs.json';
import type { RoundData, PetState, Buff, Action, OperationResult, BuffConfigItem } from '../types';

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

export const useRounds = () => {
  const [rounds, setRounds] = useState<RoundData[]>([createInitialRound()]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);

  // 同步阵容变化到当前回合
  const syncTeamToRound = useCallback((playerNum: number, team: string[]) => {
    const playerKey = `player_${playerNum}` as 'player_1' | 'player_2';

    setRounds((prevRounds) => {
      const newRounds = [...prevRounds];
      const round = { ...newRounds[currentRoundIndex] };

      if (round.cur_round === 1) {
        round[playerKey] = {
          ...round[playerKey],
          pets: team.map((name) => DEFAULT_PET_STATE(name)),
        };
      } else {
        round[playerKey] = {
          ...round[playerKey],
          pets: prevRounds[currentRoundIndex - 1][playerKey].pets.map((p: PetState) => ({ ...p })),
        };
      }

      if (team.length > 0 && !round[playerKey].active_pet) {
        round[playerKey] = {
          ...round[playerKey],
          active_pet: team[0],
        };
      }

      newRounds[currentRoundIndex] = round;
      return newRounds;
    });
  }, [currentRoundIndex]);

  // 添加新回合
  const addRound = useCallback(() => {
    setRounds((prevRounds) => {
      const prevRound = prevRounds[prevRounds.length - 1];

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

      return [...prevRounds, newRound];
    });

    setCurrentRoundIndex(rounds.length); // eslint-disable-line react-hooks/exhaustive-deps
  }, [rounds.length]);

  // 删除最后一个回合
  const deleteRound = useCallback((): OperationResult => {
    if (rounds.length <= 1) {
      return { success: false, message: '至少需要保留1回合' };
    }

    setRounds((prevRounds) => prevRounds.slice(0, -1));
    setCurrentRoundIndex(rounds.length - 2); // eslint-disable-line react-hooks/exhaustive-deps
    return { success: true, message: `已删除第 ${rounds.length} 回合` };
  }, [rounds.length]);

  // 删除全部回合并重置
  const deleteAllRounds = useCallback((): OperationResult => {
    setRounds((prevRounds) => {
      const firstRound = prevRounds[0];
      return [{
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
      }];
    });
    setCurrentRoundIndex(0);
    return { success: true, message: '已删除全部回合并重置！' };
  }, []);

  // 更新精灵状态
  const updatePetState = useCallback((playerKey: string, petIndex: number, field: string, value: number) => {
    setRounds((prevRounds) => {
      const newRounds = [...prevRounds];
      const round = { ...newRounds[currentRoundIndex] };
      const pk = playerKey as 'player_1' | 'player_2';
      if (round[pk].pets[petIndex]) {
        const pets = [...round[pk].pets];
        pets[petIndex] = { ...pets[petIndex], [field]: value };
        round[pk] = { ...round[pk], pets };
        newRounds[currentRoundIndex] = round;
      }
      return newRounds;
    });
  }, [currentRoundIndex]);

  // 更新场上精灵
  const updateActivePet = useCallback((playerKey: string, petName: string) => {
    setRounds((prevRounds) => {
      const newRounds = [...prevRounds];
      const round = { ...newRounds[currentRoundIndex] };
      const pk = playerKey as 'player_1' | 'player_2';
      round[pk] = {
        ...round[pk],
        active_pet: petName,
        buff: resetBuff(),
      };
      newRounds[currentRoundIndex] = round;
      return newRounds;
    });
  }, [currentRoundIndex]);

  // 更新增益减益
  const updateBuff = useCallback((playerKey: string, field: string, value: number) => {
    setRounds((prevRounds) => {
      const newRounds = [...prevRounds];
      const round = { ...newRounds[currentRoundIndex] };
      const pk = playerKey as 'player_1' | 'player_2';
      round[pk] = {
        ...round[pk],
        buff: { ...round[pk].buff, [field]: value },
      };
      newRounds[currentRoundIndex] = round;
      return newRounds;
    });
  }, [currentRoundIndex]);

  // 清空所有增益减益
  const clearAllBuffs = useCallback((playerKey: string) => {
    setRounds((prevRounds) => {
      const newRounds = [...prevRounds];
      const round = { ...newRounds[currentRoundIndex] };
      const pk = playerKey as 'player_1' | 'player_2';
      round[pk] = {
        ...round[pk],
        buff: resetBuff(),
      };
      newRounds[currentRoundIndex] = round;
      return newRounds;
    });
  }, [currentRoundIndex]);

  // 更新行动
  const updateAction = useCallback((playerKey: string, action: Action) => {
    setRounds((prevRounds) => {
      const newRounds = [...prevRounds];
      const round = { ...newRounds[currentRoundIndex] };
      const pk = playerKey as 'player_1' | 'player_2';
      round[pk] = { ...round[pk], action };
      newRounds[currentRoundIndex] = round;
      return newRounds;
    });
  }, [currentRoundIndex]);

  const currentRound = rounds[currentRoundIndex];

  return {
    rounds,
    currentRound,
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
  };
};