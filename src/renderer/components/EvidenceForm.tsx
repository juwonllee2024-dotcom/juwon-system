import { useState } from 'react';
import type { JuwonSystemApi } from '../system-api';

export interface EvidenceFormProps {
  questId: string;
  api: JuwonSystemApi;
}

function basename(filename: string): string {
  return filename.split(/[\\/]/).pop() ?? filename;
}

export function EvidenceForm({ questId, api }: EvidenceFormProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function pickFile() {
    setMessage(null);
    const response = await api.pickEvidenceFile();
    if (!response.ok) {
      setMessage(response.message);
      return;
    }
    setSelectedPath(response.value?.path ?? null);
  }

  async function submit() {
    if (!selectedPath) {
      setMessage('먼저 증거 파일을 선택하세요.');
      return;
    }
    setBusy(true);
    setMessage(null);
    const response = await api.submitEvidence({
      questId,
      evidence: { type: 'FILE', locator: selectedPath, metadata: {} },
    });
    setBusy(false);
    setMessage(response.ok ? '증거가 제출되었습니다.' : response.message);
  }

  return (
    <section className="evidence-form" aria-labelledby="evidence-heading">
      <h2 id="evidence-heading">EVIDENCE</h2>
      <button className="secondary" type="button" onClick={() => void pickFile()} disabled={busy}>
        증거 파일 선택
      </button>
      {selectedPath && <p className="selected-file">{basename(selectedPath)}</p>}
      <button type="button" onClick={() => void submit()} disabled={busy || !selectedPath}>
        {busy ? '제출 중…' : '증거 제출'}
      </button>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
