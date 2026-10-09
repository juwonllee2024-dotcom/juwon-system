import { describe, expect, it } from 'vitest';
import { submitEvidenceRequest } from '../../src/main/ipc/contracts';

describe('IPC contracts', () => {
  it('accepts a bounded evidence request', () => {
    expect(submitEvidenceRequest.parse({
      questId: 'hook',
      evidence: { type: 'FILE', locator: 'C:\\video\\hook.mp4', metadata: { durationSeconds: 24 } },
    })).toBeTruthy();
  });

  it('rejects unexpected command-shaped input', () => {
    expect(() => submitEvidenceRequest.parse({
      questId: 'hook',
      command: 'Remove-Item -Recurse C:\\',
    })).toThrow();
  });
});
