import { app, BrowserWindow, Menu, Tray, dialog, ipcMain, nativeImage } from 'electron';
import { join } from 'path';
import { writeFile, readFile } from 'fs/promises';
import { buildMenuTemplate } from './menu';

const isMac = process.platform === 'darwin';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// 创建主窗口
const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: '洛克王国PVP对局录入工具',
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  // 窗口准备好后再显示，避免白屏
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // 加载渲染进程
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  // 窗口关闭时最小化到托盘（非 macOS）
  mainWindow.on('close', (event) => {
    if (!isMac && !app.isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  // 构建原生菜单
  const menuTemplate = buildMenuTemplate(mainWindow);
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
};

// 创建系统托盘
const createTray = () => {
  const iconPath = join(__dirname, '../../resources/icon.png');
  let trayIcon: Electron.NativeImage;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    if (trayIcon.isEmpty()) {
      trayIcon = nativeImage.createEmpty();
    }
  } catch {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('洛克王国PVP对局录入工具');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        (app as unknown as Record<string, boolean>).isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
};

// 注册 IPC 通信处理
const registerIPC = () => {
  // 保存文件
  ipcMain.handle('save-file', async (_event, data: string) => {
    if (!mainWindow) return { success: false, message: '窗口未就绪' };

    const result = await dialog.showSaveDialog(mainWindow, {
      title: '导出对局数据',
      defaultPath: `battle_${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: 'JSON 文件', extensions: ['json'] }],
    });

    if (result.canceled || !result.filePath) {
      return { success: false, message: '用户取消保存' };
    }

    try {
      await writeFile(result.filePath, data, 'utf-8');
      return { success: true, message: '保存成功' };
    } catch (error) {
      return { success: false, message: `保存失败: ${(error as Error).message}` };
    }
  });

  // 打开文件
  ipcMain.handle('open-file', async () => {
    if (!mainWindow) return { success: false, message: '窗口未就绪' };

    const result = await dialog.showOpenDialog(mainWindow, {
      title: '导入对局数据',
      filters: [{ name: 'JSON 文件', extensions: ['json'] }],
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, message: '用户取消导入' };
    }

    try {
      const content = await readFile(result.filePaths[0], 'utf-8');
      const data = JSON.parse(content);
      return { success: true, data, message: '导入成功' };
    } catch (error) {
      return { success: false, message: `读取失败: ${(error as Error).message}` };
    }
  });

  // 获取应用版本
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });
};

// 应用生命周期
app.whenReady().then(() => {
  createMainWindow();
  registerIPC();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    } else {
      mainWindow?.show();
    }
  });
});

// 所有窗口关闭时退出（非 macOS）
app.on('window-all-closed', () => {
  if (!isMac) {
    (app as unknown as Record<string, boolean>).isQuitting = true;
    app.quit();
  }
});

// macOS 退出前处理
app.on('before-quit', () => {
  (app as unknown as Record<string, boolean>).isQuitting = true;
});