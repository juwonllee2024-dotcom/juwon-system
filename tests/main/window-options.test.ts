import { describe, expect, it } from 'vitest';
import { createWindowOptions } from '../../src/main/window-options';

describe('createWindowOptions', () => {
  it('isolates the renderer from Node privileges', () => {
    const options = createWindowOptions('C:\\app\\preload.js');
    expect(options.webPreferences).toMatchObject({
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: 'C:\\app\\preload.js',
    });
  });
});
