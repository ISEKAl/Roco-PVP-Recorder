import type { BattlePatch } from '../../src/stores/battleStore';

// 所有识别结果统一返回 BattlePatch，用覆盖方式回填
// 当前阵容识别 patch = { team1: string[], team2: string[] }
export interface RecognitionResult {
  success: boolean;
  message: string;
  patch: BattlePatch;
}
