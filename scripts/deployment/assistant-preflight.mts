import { aiConfig } from '../../apps/web/src/server/assistant/config.js';
import { createDatabase } from '../../apps/web/src/server/database.js';

// Read-only gate; never prints connection strings, keys, messages or provider bodies.
const checks: { name: string; passed: boolean }[] = [];
let db: ReturnType<typeof createDatabase> | undefined;
try {
  const config = aiConfig();
  checks.push({ name: 'AI configuration', passed: true });
  if (!process.env.DATABASE_URL || !process.env.APP_ORIGIN) throw new Error();
  const origin = new URL(process.env.APP_ORIGIN);
  const validOrigin =
    origin.origin === process.env.APP_ORIGIN &&
    (origin.protocol === 'https:' || origin.hostname === 'localhost');
  checks.push({ name: 'Explicit application origin', passed: validOrigin });
  checks.push({
    name: 'Shared saved-history database',
    passed:
      !process.env.AI_STATE_DATABASE_URL ||
      process.env.AI_STATE_DATABASE_URL === process.env.DATABASE_URL,
  });
  db = createDatabase(process.env.DATABASE_URL);
  for (const table of [
    'assistant_threads',
    'assistant_budgets',
    'assistant_run_controls',
  ]) {
    const [row] = await db`select c.relrowsecurity as rls,
      has_table_privilege('anon', c.oid, 'SELECT') as anon_read,
      has_table_privilege('authenticated', c.oid, 'SELECT') as user_read
      from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='app_private' and c.relname=${table}`;
    checks.push({
      name: `Private table ${table}`,
      passed: !!row?.rls && !row.anon_read && !row.user_read,
    });
  }
  const model = config.model.replace(/^openai:/, '');
  const response = await fetch(
    `https://api.openai.com/v1/models/${encodeURIComponent(model)}`,
    {
      headers: { Authorization: `Bearer ${config.apiKey}` },
      signal: AbortSignal.timeout(15000),
    },
  );
  checks.push({
    name: 'OpenAI model access (no inference)',
    passed: response.ok,
  });
} catch {
  checks.push({
    name: 'Preflight completed without configuration/provider/database errors',
    passed: false,
  });
} finally {
  await db?.end();
}
console.log(
  JSON.stringify(
    { checks, readyForSmokeTest: checks.every((c) => c.passed) },
    null,
    2,
  ),
);
if (checks.some((c) => !c.passed)) process.exitCode = 1;
