import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateData, type SchemaName } from './validation';

type Fixture = {
  file: string;
  schema: string;
  schemaRef: string;
  valid?: boolean;
  schemaValid?: boolean;
};
const root = resolve(import.meta.dirname, '../../..');
const manifest = JSON.parse(
  readFileSync(resolve(root, 'examples/manifest.json'), 'utf8'),
) as { cases: Fixture[]; semanticCases: Fixture[] };

describe('canonical wire fixtures through the shared runtime validator', () => {
  for (const fixture of [...manifest.cases, ...manifest.semanticCases]) {
    it(`${fixture.file} (shape only)`, () => {
      const input: unknown = JSON.parse(
        readFileSync(resolve(root, fixture.file), 'utf8'),
      );
      const original = JSON.stringify(input);
      const schema = fixture.schema.split('/').at(-1)!.split('.')[0];
      const name =
        `${schema}.${fixture.schemaRef.split('/').at(-1)}` as SchemaName;
      expect(validateData(name, input).success).toBe(
        fixture.valid ?? fixture.schemaValid,
      );
      expect(JSON.stringify(input)).toBe(original);
    });
  }
});

describe('financial integer boundaries', () => {
  it('accepts uint256 maximum but rejects overflow and lossy JS numbers', () => {
    const maximum = (1n << 256n) - 1n;
    expect(validateData('common.Uint256', maximum.toString()).success).toBe(
      true,
    );
    for (const invalid of [
      (maximum + 1n).toString(),
      Number(maximum),
      '01',
      '-1',
      '1e3',
      ' 1',
    ]) {
      expect(validateData('common.Uint256', invalid).success).toBe(false);
    }
  });
});
