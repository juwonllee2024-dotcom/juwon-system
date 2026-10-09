import { ipcRenderer } from 'electron';
import {
  ipcChannels,
  type JuwonSystemApi,
  type ReviewQuestRequest,
  type SubmitEvidenceRequest,
} from '../main/ipc/contracts';

export function createApi(): JuwonSystemApi {
  return {
    getStatus: () => ipcRenderer.invoke(ipcChannels.getStatus),
    getQuest: (questId: string) => ipcRenderer.invoke(ipcChannels.getQuest, { questId }),
    listProjects: () => ipcRenderer.invoke(ipcChannels.listProjects),
    pickEvidenceFile: () => ipcRenderer.invoke(ipcChannels.pickEvidenceFile),
    submitEvidence: (request: SubmitEvidenceRequest) => ipcRenderer.invoke(ipcChannels.submitEvidence, request),
    reviewQuest: (request: ReviewQuestRequest) => ipcRenderer.invoke(ipcChannels.reviewQuest, request),
  };
}
