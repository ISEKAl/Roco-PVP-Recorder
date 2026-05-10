import type { BattlePatch } from '../stores/battleStore';

interface RecognitionResult {
  success: boolean;
  message: string;
  patch: BattlePatch;
}

export interface ElectronAPI {
  saveFile: (data: string) => Promise<{ success: boolean; message: string }>;
  openFile: () => Promise<{ success: boolean; data?: unknown; message?: string }>;
  getAppVersion: () => Promise<string>;
  onMenuAction: (callback: (action: string) => void) => () => void;
  recognizeTeams: () => Promise<RecognitionResult>;
  saveBallPosition: (pos: { x: number; y: number }) => Promise<void>;
  loadBallPosition: () => Promise<{ x: number; y: number } | null>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
