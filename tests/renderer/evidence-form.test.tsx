// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EvidenceForm } from '../../src/renderer/components/EvidenceForm';
import { fakeSystemApi } from './fakes';

describe('EvidenceForm', () => {
  it('submits one selected evidence file through the narrow API', async () => {
    const api = fakeSystemApi({
      pickEvidenceFile: vi.fn().mockResolvedValue({ ok: true, value: { path: 'C:\\video\\hook.mp4' } }),
    });
    render(<EvidenceForm questId="hook" api={api} />);
    fireEvent.click(screen.getByRole('button', { name: /증거 파일 선택/i }));
    expect(await screen.findByText(/hook\.mp4/i)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /증거 제출/i }));
    expect(await screen.findByText(/증거가 제출되었습니다/i)).toBeVisible();
    expect(api.submitEvidence).toHaveBeenCalledWith({
      questId: 'hook',
      evidence: { type: 'FILE', locator: 'C:\\video\\hook.mp4', metadata: {} },
    });
  });
});
