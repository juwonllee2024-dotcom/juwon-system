import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { app, BrowserWindow, ipcMain, type IpcMain } from 'electron';
import path from 'node:path';
import { openDatabase, type SystemDatabase } from './db/database';
import { registerIpcHandlers } from './ipc/register';
import { createDailyBackup } from './services/backups';
import { runInitialImport } from './services/initial-import';
import { createProjectService } from './services/projects';
import { createQuestService } from './services/quests';
import { createWindowOptions } from './window-options';

type QuestService = ReturnType<typeof createQuestService>;
type ExtraRegistration = (ipc: IpcMain, quests: QuestService) => void;
type StageReporter = (stage: string) => void;

async function hashLocator(locator: string): Promise<string> {
  try {
    const bytes = await readFile(locator);
    return createHash('sha256').update(bytes).digest('hex');
  } catch {
    return createHash('sha256').update(locator).digest('hex');
  }
}

function createMainWindow(forcePackagedRenderer: boolean): BrowserWindow {
  const preloadPath = path.join(__dirname, '..', 'preload', 'index.js');
  const window = new BrowserWindow(createWindowOptions(preloadPath));
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.once('ready-to-show', () => window.show());
  if (app.isPackaged || forcePackagedRenderer) void window.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  else void window.loadURL(process.env.VITE_DEV_SERVER_URL ?? 'http://127.0.0.1:5173');
  return window;
}

export function startApplication(
  registerExtra?: ExtraRegistration,
  reportStage: StageReporter = () => undefined,
  forcePackagedRenderer = false,
): void {
  let systemDb: SystemDatabase | undefined;
  void app.whenReady().then(async () => {
    reportStage('ready');
    const dataDirectory = app.getPath('userData');
    const databasePath = path.join(dataDirectory, 'juwon-system.db');
    if (existsSync(databasePath)) {
      await createDailyBackup(databasePath, path.join(dataDirectory, 'backups'), new Date());
    }
    reportStage('backup');
    systemDb = openDatabase(databasePath);
    reportStage('database');
    runInitialImport(systemDb);
    reportStage('import');
    const projects = createProjectService(systemDb, Date.now);
    const quests = createQuestService(systemDb, Date.now, hashLocator);
    registerIpcHandlers(ipcMain, { systemDb, projects, quests });
    registerExtra?.(ipcMain, quests);
    reportStage('ipc');
    createMainWindow(forcePackagedRenderer);
    reportStage('window');
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow(forcePackagedRenderer);
    });
  });
  app.on('window-all-closed', () => app.quit());
  app.on('will-quit', () => systemDb?.close());
}
