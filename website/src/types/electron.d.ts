export interface ElectronAPI {
  saveFile: (data: string) => Promise<{ success: boolean; message: string }>;
  openFile: () => Promise<{ success: boolean; data?: unknown; message?: string }>;
  getAppVersion: () => Promise<string>;
  onMenuAction: (callback: (action: string) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};