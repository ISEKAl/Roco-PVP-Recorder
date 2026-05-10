import { contextBridge, ipcRenderer } from 'electron';

let menuActionCallback: ((action: string) => void) | null = null;

ipcRenderer.on('menu-action', (_event, data: { action: string }) => {
  if (menuActionCallback) {
    menuActionCallback(data.action);
  }
});

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