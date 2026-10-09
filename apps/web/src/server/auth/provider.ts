import { createClient } from '@supabase/supabase-js';
/** Supabase owns signature/session verification; credentials stay out of logs. */
export function authProvider(url: string, key: string) {
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          redirect: 'error',
          signal: init?.signal
            ? AbortSignal.any([init.signal, AbortSignal.timeout(8000)])
            : AbortSignal.timeout(8000),
        }),
    },
  });
}
