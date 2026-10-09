import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import { MissionView } from '../../src/client/views/MissionView';
import type { MissionApi } from '../../src/client/api';

afterEach(cleanup);

const profile = {
  id: 'u1', ageBand: 'TEEN' as const, codeName: 'NOVA', termsVersion: '2026-08-25',
  permissionConfirmedAt: '', createdAt: '', updatedAt: ''
};
const readyMission = {
  id: 'm1', goalId: 'g1', title: '요구사항 해독', objective: '과제 요구사항을 읽고 완료 조건 3개 적기',
  completionCondition: '완료 조건 3개 기록', estimatedMinutes: 15, state: 'READY' as const, rewardXp: 10,
  allocation: { focus: 3, knowledge: 2, execution: 5 },
  steps: [{ id: 's1', position: 0, text: '지시문 읽기', completed: false }]
};

function fakeApi(overrides: Partial<MissionApi> = {}): MissionApi {
  return {
    getBootstrap: vi.fn(), createProfile: vi.fn(), createGoal: vi.fn(),
    startMission: vi.fn().mockResolvedValue({ ...readyMission, state: 'ACTIVE' }),
    coachMission: vi.fn().mockResolvedValue({ kind: 'MESSAGE', text: '제출물에 필요한 것은 무엇인가요?' }),
    completeMission: vi.fn().mockResolvedValue({
      totalXp: 10, playerLevel: 1, abilities: { focus: 3, knowledge: 2, execution: 5 }, lastAwardXp: 10, newAward: true
    }),
    getProgress: vi.fn().mockResolvedValue({ totalXp: 0, playerLevel: 1, abilities: { focus: 0, knowledge: 0, execution: 0 }, lastAwardXp: 0, newAward: false }),
    exportAccount: vi.fn(), deleteAccount: vi.fn(), ...overrides
  };
}

test('keeps one mission and one primary action visible', () => {
  render(<MissionView api={fakeApi()} profile={profile} mission={readyMission} />);
  expect(screen.getByRole('heading', { name: '요구사항 해독' })).toBeVisible();
  expect(screen.getByRole('button', { name: '미션 시작' })).toBeVisible();
  expect(screen.queryByText('PROJECT COMMAND')).not.toBeInTheDocument();
});

test('submits student evidence and announces one award', async () => {
  const api = fakeApi();
  const user = userEvent.setup();
  render(<MissionView api={api} profile={profile} mission={{ ...readyMission, state: 'ACTIVE' }} />);
  await user.type(screen.getByLabelText('완료한 내용'), '완료 조건 세 가지를 제 말로 적었습니다.');
  await user.type(screen.getByLabelText('확인 방법'), '슬라이드 설명을 제출했습니다.');
  await user.click(screen.getByRole('button', { name: '증거 제출' }));
  expect(api.completeMission).toHaveBeenCalledWith('m1', expect.objectContaining({ summary: expect.any(String) }));
  expect(screen.getByRole('status')).toHaveTextContent('+10 XP');
});

test('shows one process hint behind secondary help', async () => {
  const user = userEvent.setup();
  render(<MissionView api={fakeApi()} profile={profile} mission={{ ...readyMission, state: 'ACTIVE' }} />);
  await user.click(screen.getByRole('button', { name: '도움 요청' }));
  await user.click(screen.getByRole('button', { name: '힌트' }));
  expect(await screen.findByText('제출물에 필요한 것은 무엇인가요?')).toBeVisible();
});
