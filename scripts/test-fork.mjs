import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
if (!process.env.ETHEREUM_RPC_URL?.trim()) {
  console.error(
    'BLOCKED: ETHEREUM_RPC_URL is required. Fork tests were not run.',
  );
  process.exit(2);
}
const result = spawnSync(
  'pnpm',
  ['exec', 'forge', 'test', '-vv', ...process.argv.slice(2)],
  {
    cwd: fileURLToPath(new URL('../packages/contracts/', import.meta.url)),
    env: { ...process.env, FOUNDRY_PROFILE: 'fork' },
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  },
);
let output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
for (const [key, value] of Object.entries(process.env)) {
  if (
    /KEY|TOKEN|SECRET|PASSWORD|RPC_URL/.test(key) &&
    value &&
    value.length > 5
  )
    output = output.replaceAll(value, '[REDACTED]');
}
// Providers sometimes echo only a credential-bearing URL path instead of the full URL.
output = output.replace(/https?:\/\/[^\s"'<>]+/g, '[RPC_URL_REDACTED]');
process.stdout.write(output);
if (result.error)
  console.error(
    'Fork runner failed to launch. Check Node/pnpm/Forge installation.',
  );
process.exit(result.status ?? 1);
