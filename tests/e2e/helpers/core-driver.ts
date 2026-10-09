import { mkdtemp, rm } from 'node:fs/promises';
import { once } from 'node:events';
import os from 'node:os';
import path from 'node:path';
import type { ChildProcess } from 'node:child_process';
import { _electron as electron, type ElectronApplication, type Page } from '@playwright/test';

const dataDirectories = new Set<string>();
const activeDrivers = new Set<CoreDriver>();
const questId = 'free-unlimited-video-check';

interface TestBridge {
  __testSubmitEvidence(questId: string, evidencePath: string): Promise<{ ok: boolean; code?: string; message?: string }>;
  __testCompleteReview(questId: string, reason: string): Promise<{ ok: boolean; code?: string; message?: string }>;
}

export async function createE2eDataDir(): Promise<string> {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'juwon-system-e2e-'));
  dataDirectories.add(directory);
  return directory;
}

export function fixturePath(name: string): string {
  const fixtureRoot = path.resolve('tests', 'fixtures') + path.sep;
  const resolved = path.resolve(fixtureRoot, name);
  if (!resolved.startsWith(fixtureRoot)) throw new Error('Fixture escaped the fixture directory');
  return resolved;
}

interface LaunchedApplication {
  app: ElectronApplication;
  page: Page;
  diagnostics: string[];
}

async function launch(dataDir: string): Promise<LaunchedApplication> {
  const executablePath = path.resolve('node_modules', 'electron', 'dist', 'electron.exe');
  const packagedApplication = path.resolve('release-test', 'win-unpacked', 'resources', 'app.asar');
  const app = await electron.launch({
    executablePath,
    args: [packagedApplication, `--user-data-dir=${dataDir}`],
  });
  const diagnostics: string[] = [];
  app.process().stderr?.on('data', (chunk: Buffer) => diagnostics.push(chunk.toString('utf8')));
  app.process().stdout?.on('data', (chunk: Buffer) => diagnostics.push(chunk.toString('utf8')));
  let page: Page;
  try {
    page = await app.firstWindow({ timeout: 10_000 });
  } catch (error) {
    const exitCode = app.process().exitCode;
    if (exitCode === null) await app.close();
    throw new Error(`Packaged app created no window (exit=${String(exitCode)}): ${diagnostics.join('')}`, { cause: error });
  }
  page.on('console', (message) => diagnostics.push(`[console:${message.type()}] ${message.text()}`));
  page.on('pageerror', (error) => diagnostics.push(`[pageerror] ${error.message}`));
  await page.waitForLoadState('domcontentloaded');
  return { app, page, diagnostics };
}

export class CoreDriver {
  private app: ElectronApplication;
  private page: Page;
  private diagnostics: string[];
  private childProcess: ChildProcess;

  constructor(private readonly dataDir: string, launched: LaunchedApplication) {
    this.app = launched.app;
    this.page = launched.page;
    this.diagnostics = launched.diagnostics;
    this.childProcess = launched.app.process();
  }

  async statusHeading(): Promise<string> {
    try {
      return (await this.page.getByRole('heading', { name: 'PLAYER STATUS' }).textContent({ timeout: 5_000 })) ?? '';
    } catch (error) {
      const body = await this.page.locator('body').innerText().catch(() => '<body unavailable>');
      throw new Error(`PLAYER STATUS missing at ${this.page.url()}; body=${body}; ${this.diagnostics.join(' | ')}`, { cause: error });
    }
  }

  async openCurrentQuest(): Promise<void> {
    await this.page.locator('.quest-card').click();
  }

  async questHeading(): Promise<string> {
    return (await this.page.getByRole('heading', { name: 'QUEST DETAIL' }).textContent()) ?? '';
  }

  async submitEvidence(evidencePath: string): Promise<void> {
    await this.page.evaluate(async ({ currentQuestId, selectedPath }) => {
      const api = (window as unknown as { juwonSystem: TestBridge }).juwonSystem;
      const result = await api.__testSubmitEvidence(currentQuestId, selectedPath);
      if (!result.ok) throw new Error(`${result.code ?? 'ERROR'}: ${result.message ?? 'Evidence submission failed'}`);
    }, { currentQuestId: questId, selectedPath: evidencePath });
  }

  async completePendingReviewForTest(reason: string): Promise<void> {
    await this.page.evaluate(async ({ currentQuestId, reviewReason }) => {
      const api = (window as unknown as { juwonSystem: TestBridge }).juwonSystem;
      const result = await api.__testCompleteReview(currentQuestId, reviewReason);
      if (!result.ok) throw new Error(`${result.code ?? 'ERROR'}: ${result.message ?? 'Review failed'}`);
    }, { currentQuestId: questId, reviewReason: reason });
  }

  async youtubeXp(): Promise<number> {
    const statusButton = this.page.getByRole('button', { name: 'STATUS' });
    if (await statusButton.isVisible()) await statusButton.click();
    const card = this.page.locator('.stat-card').filter({ hasText: 'YOUTUBE' });
    const text = await card.locator('small').textContent();
    const match = text?.match(/(\d+)\s+XP/);
    if (!match?.[1]) throw new Error('YouTube XP was not visible');
    return Number(match[1]);
  }

  async restart(): Promise<void> {
    await this.stopApplication();
    const relaunched = await launch(this.dataDir);
    this.app = relaunched.app;
    this.page = relaunched.page;
    this.diagnostics = relaunched.diagnostics;
    this.childProcess = relaunched.app.process();
  }

  private async stopApplication(): Promise<void> {
    if (this.childProcess.exitCode !== null) return;
    const exited = once(this.childProcess, 'exit');
    await this.app.close();
    await Promise.race([
      exited,
      new Promise<never>((_resolve, reject) => setTimeout(() => reject(new Error('Electron did not exit within 10 seconds')), 10_000)),
    ]);
  }

  async close(): Promise<void> {
    await this.stopApplication().catch(() => undefined);
    activeDrivers.delete(this);
  }
}

export async function launchPackagedCore({ dataDir }: { dataDir: string }): Promise<CoreDriver> {
  const driver = new CoreDriver(dataDir, await launch(dataDir));
  activeDrivers.add(driver);
  return driver;
}

export async function cleanupE2eDirectories(): Promise<void> {
  await Promise.all([...activeDrivers].map((driver) => driver.close()));
  const tempRoot = path.resolve(os.tmpdir()) + path.sep;
  for (const directory of dataDirectories) {
    const resolved = path.resolve(directory);
    if (!resolved.startsWith(tempRoot) || !path.basename(resolved).startsWith('juwon-system-e2e-')) {
      throw new Error(`Refusing to remove unsafe e2e directory: ${resolved}`);
    }
    await rm(resolved, { recursive: true, force: true });
    dataDirectories.delete(directory);
  }
}
