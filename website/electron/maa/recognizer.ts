/// <reference types="@maaxyz/maa-node" />
import { readdirSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { app } from 'electron';
import { loadTemplateNames, getTemplatesPath } from './templates';
import { buildTeamRecognitionPipeline } from './pipeline';
import type { RecognitionResult } from './types';
import type { BattlePatch } from '../../src/stores/battleStore';

let initialized = false;

// 动态加载 @maaxyz/maa-node（原生 C++ 模块）
// 注意：maa-node 是 CJS 模块，ESM 动态 import 会将其 exports 包裹在 default 中
async function loadMaa(): Promise<typeof maa> {
  const mod = await import('@maaxyz/maa-node') as { default: typeof maa };
  return mod.default;
}

async function initMaa(): Promise<void> {
  if (initialized) return;
  const maa = await loadMaa();
  const logDir = join(app.getPath('userData'), 'maa_logs');
  if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true });
  maa.Global.log_dir = logDir;
  initialized = true;
}

async function findGameWindow(): Promise<string | null> {
  const maa = await loadMaa();
  const devices = await maa.Win32Controller.find();
  if (!devices) return null;
  for (const [handle, _cls, name] of devices) {
    if (name.includes('洛克') || name.includes('世界')) return handle;
  }
  return null;
}

export async function recognizeTeamBattle(): Promise<RecognitionResult> {
  const maa = await loadMaa();
  await initMaa();

  const hwnd = await findGameWindow();
  if (!hwnd) {
    return {
      success: false,
      message: '未找到游戏窗口，请先打开"洛克王国：世界"',
      patch: {},
    };
  }

  const templateNames = loadTemplateNames();
  if (templateNames.length === 0) {
    return {
      success: false,
      message: '未找到模板图片，请先在 resources/templates/pets/ 放入精灵头像（<精灵名>.png）',
      patch: {},
    };
  }

  const ctrl = new maa.Win32Controller(
    hwnd,
    '1' as maa.ScreencapOrInputMethods,
    '0' as maa.ScreencapOrInputMethods,
    '0' as maa.ScreencapOrInputMethods,
  );
  ctrl.screenshot_use_raw_size = true;

  const connResult = await ctrl.post_connection().wait();
  if (connResult !== 0) {
    ctrl.destroy();
    return { success: false, message: '连接游戏窗口失败', patch: {} };
  }

  const res = new maa.Resource();
  const templatesDir = getTemplatesPath();
  if (existsSync(templatesDir)) {
    const files = readdirSync(templatesDir).filter((f) => f.endsWith('.png'));
    for (const f of files) {
      await res.post_image(join(templatesDir, f)).wait();
    }
  }
  res.override_pipeline(buildTeamRecognitionPipeline());

  let team1Str = '';
  let team2Str = '';

  res.register_custom_recognizer('recognize_teams', async function (self) {
    const resolution = self.context.tasker.controller?.resolution;
    const [w, h] = resolution ?? [1920, 1080];

    const leftRoi: maa.Rect = [0, 0, Math.floor(w / 2), h];
    const rightRoi: maa.Rect = [Math.floor(w / 2), 0, Math.floor(w / 2), h];

    const team1: string[] = [];
    const team2: string[] = [];

    for (const name of templateNames) {
      const left = await self.context.run_recognition_direct(
        'TemplateMatch',
        { template: `${name}.png`, roi: leftRoi, threshold: 0.7 },
        self.image,
      );
      if (left?.hit && !team1.includes(name)) team1.push(name);

      const right = await self.context.run_recognition_direct(
        'TemplateMatch',
        { template: `${name}.png`, roi: rightRoi, threshold: 0.7 },
        self.image,
      );
      if (right?.hit && !team2.includes(name)) team2.push(name);
    }

    team1Str = JSON.stringify(team1);
    team2Str = JSON.stringify(team2);
    return [null, JSON.stringify({ team1, team2 })] as [null, string];
  });

  const tskr = new maa.Tasker();
  tskr.controller = ctrl;
  tskr.resource = res;

  if (!tskr.inited) {
    ctrl.destroy();
    tskr.destroy();
    res.destroy();
    return { success: false, message: 'Tasker 初始化失败', patch: {} };
  }

  await tskr.post_task('RecognizeTeams').wait();

  let team1: string[] = [];
  let team2: string[] = [];
  try { team1 = JSON.parse(team1Str); } catch { /* empty */ }
  try { team2 = JSON.parse(team2Str); } catch { /* empty */ }

  ctrl.destroy();
  tskr.destroy();
  res.destroy();

  if (team1.length === 0 && team2.length === 0) {
    return { success: false, message: '未识别到精灵，请确保游戏画面清晰且阵容区域可见', patch: {} };
  }

  const patch: BattlePatch = { team1, team2 };
  return {
    success: true,
    message: `识别完成！玩家1: ${team1.length}只，玩家2: ${team2.length}只`,
    patch,
  };
}
