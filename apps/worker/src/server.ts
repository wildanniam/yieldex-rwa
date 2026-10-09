import { createServer } from 'node:http';
import { INTERFACE_VERSION, STARTER_STAGE } from '@rwa/shared';

export function getWorkerHealth() {
  return {
    service: 'worker',
    status: 'ok',
    stage: STARTER_STAGE,
    interfaceVersion: INTERFACE_VERSION,
    jobsEnabled: false,
  } as const;
}

export function createWorkerServer() {
  return createServer((request, response) => {
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Cache-Control', 'no-store');
    if (request.url !== '/health') {
      response.writeHead(404).end(JSON.stringify({ error: 'NOT_FOUND' }));
      return;
    }
    if (request.method !== 'GET') {
      response
        .writeHead(405, { Allow: 'GET' })
        .end(JSON.stringify({ error: 'METHOD_NOT_ALLOWED' }));
      return;
    }
    response.writeHead(200).end(JSON.stringify(getWorkerHealth()));
  });
}
