import { INTERFACE_VERSION } from '@rwa/shared';

/** Process liveness only. Does not probe or claim readiness of any integration. */
export function getWebHealth() {
  return {
    service: 'web',
    status: 'ok',
    stage: 'CORE_BASELINE',
    interfaceVersion: INTERFACE_VERSION,
    integrations: 'NOT_PROBED',
  } as const;
}
