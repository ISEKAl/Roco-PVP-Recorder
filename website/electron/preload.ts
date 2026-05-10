import { contextBridge, ipcRenderer } from 'electron';

console.log('[preload] preload 脚本开始加载...');
console.log('[preload] ipcRenderer 是否可用:', !!ipcRenderer);
console.log('[preload] contextBridge 是否可用:', !!contextBridge);

let menuActionCallback: ((action: string) => void) | null = null;

ipcRenderer.on('menu-action', (_event, data: { action: string }) => {
  if (menuActionCallback) {
    menuActionCallback(data.action);
  }
});

try {
  contextBridge.exposeInMainWorld('electronAPI', {
    saveFile: (data: string) => ipcRenderer.invoke('save-file', data),
    openFile: () => ipcRenderer.invoke('open-file'),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    onMenuAction: (callback: (action: string) => void) => {
      menuActionCallback = callback;
      return () => { menuActionCallback = null; };
    },
    recognizeTeams: () => ipcRenderer.invoke('recognize-teams'),
    saveBallPosition: (pos: { x: number; y: number }) =>
      ipcRenderer.invoke('save-ball-position', pos),
    loadBallPosition: () =>
      ipcRenderer.invoke('load-ball-position') as Promise<{ x: number; y: number } | null>,
  });
  console.log('[preload] electronAPI 已成功暴露到主世界');
} catch (err) {
  console.error('[preload] 暴露 electronAPI 失败:', err);
}