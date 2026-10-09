import { expect, test } from '@playwright/test';

test('awakening mission completion persists across reload', async ({ page, request }) => {
  await request.delete('/api/account', { data: { confirmation: 'DELETE MY MISSION DATA' } });
  await page.goto('/');
  await page.getByLabel('출생연도').fill('2011');
  await page.getByLabel('보호자와 이용 약관을 확인했고 이용 허락을 받았습니다.').check();
  await page.getByLabel('코드네임').fill('NOVA');
  await page.getByLabel('과제 또는 시험').fill('과학 화산 발표');
  await page.getByLabel('마감일').fill('2026-09-01');
  await page.getByRole('button', { name: '미션 생성' }).click();
  await page.getByRole('button', { name: '미션 시작' }).click();
  await page.getByLabel('완료한 내용').fill('과제 지시문을 읽고 완료 조건 세 가지를 적었습니다.');
  await page.getByLabel('확인 방법').fill('슬라이드 설명을 제출했습니다.');
  await page.getByRole('button', { name: '증거 제출' }).click();
  await expect(page.getByRole('status')).toContainText('+10 XP');
  await page.reload();
  await expect(page.getByText('TOTAL XP 10')).toBeVisible();
});
