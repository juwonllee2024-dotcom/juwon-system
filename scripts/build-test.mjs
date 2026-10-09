import { spawnSync } from 'node:child_process';

function run(args, environment = process.env) {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit', env: environment });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(['scripts/build-main.mjs'], { ...process.env, JUWON_SYSTEM_TEST_BUILD: '1' });
run(['node_modules/vite/bin/vite.js', 'build', '--configLoader', 'runner']);
