// 配置数据类型
export interface PokemonConfig {
  id: number;
  name: string;
  image_url?: string;
}

export interface SkillConfig {
  id: number;
  name: string;
  image_url?: string;
}

export interface BuffConfigItem {
  key: string;
  label: string;
  min: number;
  max: number;
  default: number;
}

// 精灵状态
export interface PetState {
  name: string;
  hp_ratio: number;
  mp: number;
}

// 增益减益
export type Buff = Record<string, number>;

// 行动
export interface Action {
  type: 'skill' | 'switch' | null;
  skill_name?: string | null;
  to?: string | null;
}

// 玩家回合状态
export interface PlayerRoundState {
  active_pet: string;
  pets: PetState[];
  buff: Buff;
  action: Action | null;
}

// 回合数据
export interface RoundData {
  cur_round: number;
  player_1: PlayerRoundState;
  player_2: PlayerRoundState;
}

// 对局导出数据
export interface BattleExportData {
  time: string;
  winner: number;
  total_round: number;
  team_1: string[];
  team_2: string[];
  round: RoundData[];
}

// 导出结果
export interface ExportResult {
  success: boolean;
  message: string;
}

// 操作结果
export interface OperationResult {
  success: boolean;
  message: string;
}

// 玩家编号
export type PlayerNum = 1 | 2;

// 玩家主题配色
export interface PlayerTheme {
  bgColor: string;
  borderColor: string;
  color: string;
  tagColor: string;
  hoverBgColor: string;
}