'use client';
/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from 'react';
import type { SchemaName } from '@rwa/shared/validation';
import { checkedResponse, marketRequest, walletError } from './client-api';

/** Cancel obsolete requests; a new account/query never renders an earlier result. */
export function useRead<T>(
  path: string | null,
  schema: SchemaName,
  revision = 0,
) {
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState<{
    path: string | null;
    data: T | null;
    error: string;
    loading: boolean;
  }>({ path: null, data: null, error: '', loading: true });
  const refresh = useCallback(() => setRetry((n) => n + 1), []);
  useEffect(() => {
    if (!path) {
      setState({ path, data: null, error: '', loading: false });
      return;
    }
    const controller = new AbortController();
    setState({ path, data: null, error: '', loading: true });
    void marketRequest(path, { signal: controller.signal })
      .then((value) => {
        const data = checkedResponse<T>(schema, value);
        if (!controller.signal.aborted)
          setState({ path, data, error: '', loading: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({
            path,
            data: null,
            error: walletError(error),
            loading: false,
          });
      });
    return () => controller.abort();
  }, [path, schema, retry, revision]);
  const current =
    state.path === path ? state : { data: null, error: '', loading: !!path };
  return { ...current, refresh };
}
