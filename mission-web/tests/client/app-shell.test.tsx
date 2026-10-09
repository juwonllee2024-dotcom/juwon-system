import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { App } from '../../src/client/App';

test('shows MISSION system entry', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'MISSION' })).toBeVisible();
  expect(screen.getByText('당신의 미션이 시작되었습니다.')).toBeVisible();
});
