import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { schemas, definitionRefs } from './generated/schemas';
import type { SchemaTypes } from './generated/schema-types';

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  strictRequired: false,
  strictTypes: false,
});
ajv.addKeyword({ keyword: 'version', schemaType: 'string', valid: true });
addFormats(ajv);
for (const schema of schemas) ajv.addSchema(schema);

export type SchemaName = keyof SchemaTypes;
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: readonly { path: string; message: string }[] };

/** Shape validation only: identity, authorization and chain semantics require their own checks. */
export function validateData<K extends SchemaName>(
  name: K,
  input: unknown,
): ValidationResult<SchemaTypes[K]> {
  const validate = ajv.getSchema(definitionRefs[name]);
  if (!validate) throw new Error(`Missing compiled schema: ${name}`);
  if (validate(input)) return { success: true, data: input as SchemaTypes[K] };
  return {
    success: false,
    errors: (validate.errors ?? []).map((error) => ({
      path: error.instancePath,
      message: error.message ?? 'Invalid value',
    })),
  };
}
