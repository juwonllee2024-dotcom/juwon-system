import type { IpcMain } from 'electron';
import type { createQuestService } from '../services/quests';

export const testReviewChannel = 'test:quest-review';

export function registerTestIpcHandlers(
  ipcMain: IpcMain,
  quests: ReturnType<typeof createQuestService>,
): void {
  ipcMain.handle(testReviewChannel, (_event, raw: unknown) => {
    if (!raw || typeof raw !== 'object') {
      return { ok: false, code: 'REQUEST_INVALID', message: 'Test review request is invalid' };
    }
    const { questId, reason } = raw as Record<string, unknown>;
    if (typeof questId !== 'string' || questId.length < 1 || questId.length > 200 ||
        typeof reason !== 'string' || reason.length < 1 || reason.length > 1000) {
      return { ok: false, code: 'REQUEST_INVALID', message: 'Test review request is invalid' };
    }
    return quests.review(questId, { decision: 'complete', reason, actor: 'codex' });
  });
}
