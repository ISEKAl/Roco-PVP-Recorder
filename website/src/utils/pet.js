import { DEFAULT_PET_STATE } from '../constants';

// 从阵容名称列表生成精灵状态列表
export const createPetsFromTeam = (team) => {
  return team.map((name) => DEFAULT_PET_STATE(name));
};