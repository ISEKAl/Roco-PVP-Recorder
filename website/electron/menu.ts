import type { MenuItemConstructorOptions } from 'electron';

const isMac = process.platform === 'darwin';

// 原生菜单模板
export const buildMenuTemplate = (
  win: Electron.BrowserWindow,
  onExportClick?: () => void,
  onImportClick?: () => void,
): MenuItemConstructorOptions[] => {
  return [
    ...(isMac
      ? [
          {
            label: '洛克王国PVP对局录入工具',
            submenu: [
              { role: 'about' as const, label: '关于本应用' },
              { type: 'separator' as const },
              { role: 'quit' as const, label: '退出' },
            ],
          },
        ]
      : []),
    {
      label: '文件',
      submenu: [
        {
          label: '导出对局 JSON',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            win.webContents.send('menu-action', { action: 'export' });
          },
        },
        {
          label: '导入对局 JSON',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            win.webContents.send('menu-action', { action: 'import' });
          },
        },
        { type: 'separator' as const },
        isMac
          ? { role: 'close' as const, label: '关闭窗口' }
          : { role: 'quit' as const, label: '退出' },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo' as const, label: '撤销' },
        { role: 'redo' as const, label: '重做' },
        { type: 'separator' as const },
        { role: 'cut' as const, label: '剪切' },
        { role: 'copy' as const, label: '复制' },
        { role: 'paste' as const, label: '粘贴' },
        { role: 'selectAll' as const, label: '全选' },
      ],
    },
    {
      label: '查看',
      submenu: [
        { role: 'reload' as const, label: '刷新' },
        { role: 'forceReload' as const, label: '强制刷新' },
        { role: 'toggleDevTools' as const, label: '开发者工具' },
        { type: 'separator' as const },
        { role: 'resetZoom' as const, label: '重置缩放' },
        { role: 'zoomIn' as const, label: '放大' },
        { role: 'zoomOut' as const, label: '缩小' },
        { type: 'separator' as const },
        { role: 'togglefullscreen' as const, label: '全屏' },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于本应用',
          click: () => {
            win.webContents.send('menu-action', { action: 'about' });
          },
        },
      ],
    },
  ];
};