import { vi, type Mocked } from 'vitest';
import type { JuwonSystemApi, QuestDto, SystemStatus } from '../../src/main/ipc/contracts';

export const currentQuest: QuestDto = {
  id: 'hook',
  projectId: 'channel',
  title: 'Vheer 화면 녹화',
  objective: '무료 제한을 직접 확인하는 화면을 녹화한다.',
  state: 'OPEN',
  rewardXp: 25,
  allocation: { youtube: 25, vibeCoding: 0, business: 0 },
  deadline: null,
  createdAt: 1000,
  updatedAt: 1000,
  steps: [
    { id: 'step-1', position: 0, text: 'Vheer 열기', completedAt: null },
    { id: 'step-2', position: 1, text: '생성 제한 확인', completedAt: null },
  ],
};

export const systemStatus: SystemStatus = {
  playerXp: 0,
  playerLevel: 1,
  abilities: {
    youtube: { xp: 0, level: 1 },
    vibeCoding: { xp: 0, level: 1 },
    business: { xp: 0, level: 1 },
  },
  activeGate: {
    id: 'channel', name: '모두를 위한 AI', description: '', state: 'ACTIVE', rank: 'E',
    abilityFocus: 'youtube', createdAt: 1000, updatedAt: 1000,
  },
  currentQuest,
};

export function fakeSystemApi(overrides: Partial<Mocked<JuwonSystemApi>> = {}): Mocked<JuwonSystemApi> {
  const api: Mocked<JuwonSystemApi> = {
    getStatus: vi.fn<JuwonSystemApi['getStatus']>().mockResolvedValue({ ok: true, value: systemStatus }),
    getQuest: vi.fn<JuwonSystemApi['getQuest']>().mockResolvedValue({ ok: true, value: currentQuest }),
    listProjects: vi.fn<JuwonSystemApi['listProjects']>().mockResolvedValue({
      ok: true,
      value: [systemStatus.activeGate!],
    }),
    pickEvidenceFile: vi.fn<JuwonSystemApi['pickEvidenceFile']>().mockResolvedValue({ ok: true, value: null }),
    submitEvidence: vi.fn<JuwonSystemApi['submitEvidence']>().mockResolvedValue({
      ok: true,
      value: {
        id: 'evidence-1', questId: 'hook', type: 'FILE', normalizedLocator: 'c:\\video\\hook.mp4',
        contentHash: 'a'.repeat(64), metadata: {}, createdAt: 1000,
      },
    }),
    reviewQuest: vi.fn<JuwonSystemApi['reviewQuest']>().mockResolvedValue({ ok: true, value: currentQuest }),
  };
  return { ...api, ...overrides };
}
