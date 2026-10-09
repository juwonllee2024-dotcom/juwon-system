import { cp, mkdir, rm } from 'node:fs/promises';
import { build } from 'esbuild';

const testBuild = process.env.JUWON_SYSTEM_TEST_BUILD === '1';
await rm('dist/main', { recursive: true, force: true });
await rm('dist/preload', { recursive: true, force: true });

const common = {
  bundle: true,
  platform: 'node',
  format: 'cjs',
  sourcemap: true,
  external: ['electron', 'better-sqlite3'],
};

await build({
  ...common,
  entryPoints: [testBuild ? 'src/main/test-index.ts' : 'src/main/index.ts'],
  outfile: 'dist/main/index.js',
});
await build({
  ...common,
  entryPoints: [testBuild ? 'src/preload/test-index.ts' : 'src/preload/index.ts'],
  outfile: 'dist/preload/index.js',
});
await mkdir('dist/main/migrations', { recursive: true });
await cp('src/main/db/migrations/001-core.sql', 'dist/main/migrations/001-core.sql');
