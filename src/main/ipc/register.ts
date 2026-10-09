import type { IpcMain } from 'electron';
import { dialog } from 'electron';
import { levelForXp } from '../../domain/progression';
import type { SystemDatabase } from '../db/database';
import type { createProjectService } from '../services/projects';
import type { createQuestService } from '../services/quests';
import {
  getQuestRequest,
  ipcChannels,
  reviewQuestRequest,
  submitEvidenceRequest,
  type IpcResponse,
  type SystemStatus,
} from './contracts';

interface AbilityRow {
  youtube_xp: number;
  youtube_level: number;
  vibe_coding_xp: number;
  vibe_coding_level: number;
  business_xp: number;
  business_level: number;
}

export interface IpcServices {
  systemDb: SystemDatabase;
  projects: ReturnType<typeof createProjectService>;
  quests: ReturnType<typeof createQuestService>;
}

function failure(error: unknown): IpcResponse<never> {
  return {
    ok: false,
    code: 'INTERNAL_ERROR',
    message: error instanceof Error ? 'Operation failed' : 'Unknown operation failure',
  };
}

function safely<T>(work: () => T): IpcResponse<T> {
  try {
    return { ok: true, value: work() };
  } catch (error) {
    return failure(error);
  }
}

export function registerIpcHandlers(ipcMain: IpcMain, services: IpcServices): void {
  ipcMain.handle(ipcChannels.getStatus, (): IpcResponse<SystemStatus> => safely(() => {
    const progress = services.systemDb.db.prepare('SELECT * FROM ability_progress WHERE id = 1').get() as AbilityRow;
    const activeGate = services.projects.list().find((project) => project.state === 'ACTIVE') ?? null;
    const currentQuest = activeGate
      ? services.quests.listForProject(activeGate.id).find((quest) =>
        quest.state === 'OPEN' || quest.state === 'EVIDENCE_PENDING' || quest.state === 'REVISION_REQUIRED') ?? null
      : null;
    const playerXp = progress.youtube_xp + progress.vibe_coding_xp + progress.business_xp;
    return {
      playerXp,
      playerLevel: levelForXp(playerXp),
      abilities: {
        youtube: { xp: progress.youtube_xp, level: progress.youtube_level },
        vibeCoding: { xp: progress.vibe_coding_xp, level: progress.vibe_coding_level },
        business: { xp: progress.business_xp, level: progress.business_level },
      },
      activeGate,
      currentQuest,
    };
  }));

  ipcMain.handle(ipcChannels.getQuest, (_event, raw: unknown) => {
    const parsed = getQuestRequest.safeParse(raw);
    if (!parsed.success) return { ok: false, code: 'REQUEST_INVALID', message: 'Quest request is invalid' };
    const quest = services.quests.get(parsed.data.questId);
    return quest
      ? { ok: true, value: quest }
      : { ok: false, code: 'QUEST_NOT_FOUND', message: 'Quest does not exist' };
  });

  ipcMain.handle(ipcChannels.listProjects, () => safely(() => services.projects.list()));

  ipcMain.handle(ipcChannels.pickEvidenceFile, async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{
          name: 'Evidence',
          extensions: ['mp4', 'mov', 'mkv', 'webm', 'png', 'jpg', 'jpeg', 'gif', 'pdf', 'txt', 'md', 'json', 'zip'],
        }],
      });
      return { ok: true, value: result.canceled ? null : { path: result.filePaths[0] as string } };
    } catch (error) {
      return failure(error);
    }
  });

  ipcMain.handle(ipcChannels.submitEvidence, async (_event, raw: unknown) => {
    const parsed = submitEvidenceRequest.safeParse(raw);
    if (!parsed.success) return { ok: false, code: 'REQUEST_INVALID', message: 'Evidence request is invalid' };
    try {
      return await services.quests.submitEvidence(parsed.data.questId, parsed.data.evidence);
    } catch (error) {
      return failure(error);
    }
  });

  ipcMain.handle(ipcChannels.reviewQuest, (_event, raw: unknown) => {
    const parsed = reviewQuestRequest.safeParse(raw);
    if (!parsed.success) return { ok: false, code: 'REQUEST_INVALID', message: 'Review request is invalid' };
    try {
      return services.quests.review(parsed.data.questId, parsed.data.review);
    } catch (error) {
      return failure(error);
    }
  });
}
