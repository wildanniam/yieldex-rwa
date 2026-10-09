import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const spec = await readFile(
  resolve(root, 'docs/spec/contract-interface.md'),
  'utf8',
);
const blocks = [...spec.matchAll(/```solidity\n([\s\S]*?)```/g)].map((match) =>
  match[1].trim(),
);
if (blocks.length !== 7)
  throw new Error(
    'Contract spec structure changed: review interface generator.',
  );
const [types, structs, marketWrites, registryWrites, reads, events, errors] =
  blocks;
const readMethods = reads.match(/function[\s\S]*?;/g);
const eventItems = events.match(/event[\s\S]*?;/g);
if (readMethods.length !== 13 || eventItems.length !== 17)
  throw new Error('Review new method/event ownership.');
const preamble =
  '// SPDX-License-Identifier: MIT\n// GENERATED from docs/spec/contract-interface.md; run pnpm generate.\n// Interface-only: no deployed implementation or economic guarantees.\npragma solidity 0.8.34;\n\n';
const wrap = (name, methods, ownedEvents = []) =>
  `${preamble}import "./ProtocolTypes.sol";\nimport {IProtocolErrors} from "./IProtocolErrors.sol";\n\ninterface ${name} is IProtocolErrors {\n${methods.join('\n')}\n${ownedEvents.join('\n')}\n}\n`;
const files = {
  'ProtocolTypes.sol': `${preamble}${types}\n\n${structs}\n`,
  'IProtocolErrors.sol': `${preamble}import "./ProtocolTypes.sol";\n\ninterface IProtocolErrors {\n${errors}\n}\n`,
  'IIncomeRightsMarket.sol': wrap(
    'IIncomeRightsMarket',
    [marketWrites, ...readMethods.slice(8)],
    eventItems.slice(7),
  ),
  'ICorporateActionRegistry.sol': wrap(
    'ICorporateActionRegistry',
    [registryWrites, ...readMethods.slice(5, 8)],
    eventItems.slice(0, 7),
  ),
  'IAssetAdapter.sol': wrap('IAssetAdapter', readMethods.slice(0, 5)),
};
const check = process.argv.includes('--check');
const directory = resolve(root, 'packages/contracts/src/interfaces');
if (!check) await mkdir(directory, { recursive: true });
for (const [name, raw] of Object.entries(files)) {
  const formatted = spawnSync('forge', ['fmt', '--raw', '-'], {
    input: raw,
    encoding: 'utf8',
    cwd: resolve(root, 'packages/contracts'),
  });
  if (formatted.status !== 0)
    throw new Error(formatted.stderr || 'forge formatter failed');
  const output = formatted.stdout;
  const path = resolve(directory, name);
  if (check) {
    if ((await readFile(path, 'utf8')) !== output)
      throw new Error(`Generated interface drift: ${name}; run pnpm generate`);
  } else await writeFile(path, output);
}
console.log(
  `${check ? 'Checked' : 'Generated'} ${Object.keys(files).length} interface files (no implementations).`,
);
