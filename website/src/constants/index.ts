import type { PlayerTheme } from '../types';

// 玩家配色主题
export const PLAYER_THEME: Record<number, PlayerTheme> = {
  1: {
    bgColor: '#e6f7ff',
    borderColor: '#1890ff',
    color: '#1890ff',
    tagColor: 'blue',
    hoverBgColor: '#91caff',
  },
  2: {
    bgColor: '#fff7e6',
    borderColor: '#fa8c16',
    color: '#fa8c16',
    tagColor: 'orange',
    hoverBgColor: '#ffd591',
  },
};

// 精灵默认状态
export const DEFAULT_PET_STATE = (name: string) => ({
  name,
  hp_ratio: 1,
  mp: 10,
});

// 每回合最大精灵数量
export const MAX_TEAM_SIZE = 6;

// 能量块数量
export const ENERGY_BLOCK_COUNT = 10;

// 能量块宽度
export const ENERGY_BLOCK_WIDTH = 24;

// HP 滑块配置
export const HP_SLIDER_CONFIG = {
  min: 0,
  max: 1,
  step: 0.05,
};