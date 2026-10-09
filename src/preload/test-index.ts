import { contextBridge, ipcRenderer } from 'electron';
import { ipcChannels } from '../main/ipc/contracts';
import { createApi } from './system-api';

const api = Object.assign(createApi(), {
  __testSubmitEvidence: (questId: string, evidencePath: string) => ipcRenderer.invoke(ipcChannels.submitEvidence, {
    questId,
    evidence: { type: 'FILE', locator: evidencePath, metadata: {} },
  }),
  __testCompleteReview: (questId: string, reason: string) =>
    ipcRenderer.invoke('test:quest-review', { questId, reason }),
});

contextBridge.exposeInMainWorld('juwonSystem', Object.freeze(api));
