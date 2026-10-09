import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const requiredNode = (
  await readFile(new URL('../.nvmrc', import.meta.url), 'utf8')
).trim();
const checks = [
  ['node', ['--version']],
  ['pnpm', ['--version']],
  ['forge', ['--version']],
  ['python3', ['--version']],
  ['uv', ['--version']],
];
let failed = false;
for (const [command, args] of checks) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  const ok = result.status === 0;
  failed ||= !ok;
  console.log(
    `${ok ? 'OK' : 'MISSING'} ${command}: ${(result.stdout || result.stderr || result.error?.message || '').split('\n')[0]}`,
  );
}
if (process.version !== `v${requiredNode}`)
  console.log(`Recommended Node: ${requiredNode} (see .nvmrc).`);
console.log(
  'Starter boot needs no RPC/API key. Core integration and deployment setup follow docs/local-core.md; doctor does not inspect private env or verify deployments.',
);
process.exitCode = failed ? 1 : 0;
