import { INTERFACE_VERSION, STARTER_STAGE } from '@rwa/shared';

/** Process liveness only. Does not probe or claim readiness of any integration. */
export function getWebHealth() {
  return {
    service: 'web',
    status: 'ok',
    stage: STARTER_STAGE,
    interfaceVersion: INTERFACE_VERSION,
    integrations: 'NOT_IMPLEMENTED',
  } as const;
}
