import postgres from 'postgres';
/** Server-only. No connection URL or raw SQL error is logged. */
export function createDatabase(url: string) {
  return postgres(url, {
    max: 4,
    connect_timeout: 10,
    idle_timeout: 20,
    prepare: false,
    onnotice: () => undefined,
  });
}
