import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import { AwakeningView } from '../../src/client/views/AwakeningView';
import type { MissionApi } from '../../src/client/api';

const profile = {
  id: 'local-demo-user', ageBand: 'TEEN' as const, codeName: 'NOVA', termsVersion: '2026-08-25',
  permissionConfirmedAt: '2026-08-25T00:00:00.000Z', createdAt: '2026-08-25T00:00:00.000Z', updatedAt: '2026-08-25T00:00:00.000Z'
};
const mission = {
  id: 'm1', goalId: 'g1', title: '요구사항 해독', objective: '완료 조건 3개 적기',
  completionCondition: '세 조건 기록', estimatedMinutes: 15, state: 'READY' as const, rewardXp: 10,
  allocation: { focus: 3, knowledge: 2, execution: 5 }, steps: []
};

afterEach(cleanup);

function fakeApi(overrides: Partial<MissionApi> = {}): MissionApi {
  return {
    getBootstrap: vi.fn(),
    createProfile: vi.fn().mockResolvedValue(profile),
    createGoal: vi.fn().mockResolvedValue(mission),
    startMission: vi.fn(), coachMission: vi.fn(), completeMission: vi.fn(), getProgress: vi.fn(),
    exportAccount: vi.fn(), deleteAccount: vi.fn(),
    ...overrides
  };
}

async function fillValidForm() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('출생연도'), '2011');
  await user.click(screen.getByLabelText('보호자와 이용 약관을 확인했고 이용 허락을 받았습니다.'));
  await user.type(screen.getByLabelText('코드네임'), 'NOVA');
  await user.type(screen.getByLabelText('과제 또는 시험'), '과학 화산 발표');
  await user.type(screen.getByLabelText('마감일'), '2026-09-01');
  return user;
}

test('creates a teen profile and first mission', async () => {
  const api = fakeApi();
  const onReady = vi.fn();
  render(<AwakeningView api={api} onReady={onReady} />);
  const user = await fillValidForm();
  await user.click(screen.getByRole('button', { name: '미션 생성' }));
  expect(api.createProfile).toHaveBeenCalledOnce();
  expect(api.createGoal).toHaveBeenCalledOnce();
  expect(onReady).toHaveBeenCalledWith({ profile, mission });
});

test('preserves goal text and focuses an age error', async () => {
  const api = fakeApi({ createProfile: vi.fn().mockRejectedValue({ code: 'AGE_OR_PERMISSION_REQUIRED' }) });
  render(<AwakeningView api={api} onReady={vi.fn()} />);
  const user = await fillValidForm();
  await user.click(screen.getByRole('button', { name: '미션 생성' }));
  expect(screen.getByRole('alert')).toHaveTextContent('가입할 수 없습니다');
  expect(screen.getByLabelText('과제 또는 시험')).toHaveValue('과학 화산 발표');
  expect(screen.getByRole('alert')).toHaveFocus();
});
