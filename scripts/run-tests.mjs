import { spawnSync } from 'node:child_process';

function run(filters) {
  const result = spawnSync(process.execPath, [
    'node_modules/vitest/vitest.mjs', 'run', '--configLoader', 'runner', ...filters,
  ], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(['tests/domain', 'tests/main']);
run(['tests/renderer']);
