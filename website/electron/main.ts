import { app, BrowserWindow, Menu, dialog, ipcMain } from 'electron';
import { join } from 'path';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { buildMenuTemplate } from './menu';
import { recognizeTeamBattle } from './maa/recognizer';

let mainWindow: BrowserWindow | null = null;

// 创建主窗口
const createMainWindow = () => {
  const isDev = !!process.env.ELECTRON_RENDERER_URL;
  const preloadPath = join(__dirname, '../preload/preload.mjs');

  console.log('[main] 创建主窗口, __dirname =', __dirname);
  console.log('[main] preload 路径 =', preloadPath);
  console.log('[main] 是否为开发模式 =', isDev);

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: '洛克王国PVP对局录入工具',
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  });

  // 窗口准备好后再显示，避免白屏
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    // 开发模式下自动打开 DevTools，方便排查问题
    if (isDev) {
      mainWindow?.webContents.openDevTools();
      console.log('[main] DevTools 已打开');
    }
  });

  // 加载渲染进程
  if (isDev) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL!);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  // 构建原生菜单
  const menuTemplate = buildMenuTemplate(mainWindow);
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
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
      // 确保目标目录存在，避免因目录不存在导致的写入失败
      const dir = dirname(result.filePath);
      await mkdir(dir, { recursive: true });
      await writeFile(result.filePath, data, 'utf-8');
      return { success: true, message: '保存成功' };
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      let message = `保存失败: ${err.message}`;
      // 权限不足时给出更明确的提示
      if (err.code === 'EACCES' || err.code === 'EPERM') {
        message = `保存失败: 没有权限写入该目录，请选择其他位置（如桌面或文档文件夹）`;
      }
      return { success: false, message };
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

  // 识别双方阵容
  ipcMain.handle('recognize-teams', async () => {
    try {
      return await recognizeTeamBattle();
    } catch (error) {
      return {
        success: false,
        message: `识别异常: ${(error as Error).message}`,
        patch: {},
      };
    }
  });

  // 悬浮球位置持久化
  const BALL_POSITION_FILE = 'toolball-position.json';
  ipcMain.handle('save-ball-position', async (_e, pos: { x: number; y: number }) => {
    const dir = app.getPath('userData');
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, BALL_POSITION_FILE), JSON.stringify(pos), 'utf-8');
  });

  ipcMain.handle('load-ball-position', async () => {
    try {
      const raw = await readFile(join(app.getPath('userData'), BALL_POSITION_FILE), 'utf-8');
      return JSON.parse(raw) as { x: number; y: number };
    } catch {
      return null;
    }
  });
};

// 应用生命周期
app.whenReady().then(() => {
  createMainWindow();
  registerIPC();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    } else {
      mainWindow?.show();
    }
  });
});