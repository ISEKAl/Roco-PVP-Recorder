import { contextBridge, ipcRenderer } from 'electron';

// 暴露给渲染进程的安全 API
contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (data: string) => ipcRenderer.invoke('save-file', data),
  openFile: () => ipcRenderer.invoke('open-file'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onMenuAction: (callback: (action: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { action: string }) => {
      callback(data.action);
    };
    ipcRenderer.on('menu-action', handler);
    return () => {
      ipcRenderer.removeListener('menu-action', handler);
    };
  },
});