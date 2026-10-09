import { spawnSync } from 'node:child_process';

function run(args) {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(['scripts/package-test.mjs']);
run([
  'node_modules/vitest/vitest.mjs', 'run', '--configLoader', 'runner',
  '--config', 'vitest.e2e.config.ts',
]);
