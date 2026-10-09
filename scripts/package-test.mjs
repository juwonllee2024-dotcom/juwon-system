import { spawnSync } from 'node:child_process';

function run(args) {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(['scripts/build-test.mjs']);
run([
  'node_modules/electron-builder/out/cli/cli.js',
  '--dir', '--win', '--x64', '-c.directories.output=release-test',
]);
