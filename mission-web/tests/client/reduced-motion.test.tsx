import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

test('stylesheet honors reduced motion', async () => {
  const css = await readFile(resolve(process.cwd(), 'src/client/styles.css'), 'utf8');
  expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  expect(css).toContain('transition-duration: 0.01ms');
});
