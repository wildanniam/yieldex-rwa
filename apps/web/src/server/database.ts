import postgres from 'postgres';

/** Hosted connections require an explicit CA; local isolated Postgres stays usable. */
export function databaseOptions(url: string, ca = process.env.DATABASE_SSL_CA) {
  const host = new URL(url).hostname;
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(host);
  if (!local && !ca) throw new Error('Hosted database CA is required');
  return {
    max: 4,
    connect_timeout: 10,
    idle_timeout: 20,
    prepare: false,
    ssl: local ? (false as const) : { rejectUnauthorized: true, ca },
    onnotice: () => undefined,
  };
}
export function createDatabase(url: string) {
  return postgres(url, databaseOptions(url));
}
