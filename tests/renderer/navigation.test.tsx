// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/renderer/App';
import { fakeSystemApi } from './fakes';

describe('A/B/C navigation', () => {
  it('opens Quest Detail when the current quest is selected', async () => {
    render(<App api={fakeSystemApi()} />);
    expect(await screen.findByRole('heading', { name: /PLAYER STATUS/i })).toBeVisible();
    fireEvent.click(await screen.findByRole('button', { name: /Vheer 화면 녹화/i }));
    expect(await screen.findByRole('heading', { name: /QUEST DETAIL/i })).toBeVisible();
  });
});
