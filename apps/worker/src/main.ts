import { readWorkerConfig } from './config.js';
import { createWorkerServer, getWorkerHealth } from './server.js';

try {
  const config = readWorkerConfig(process.env);
  if (process.argv.includes('--once')) {
    console.log(JSON.stringify(getWorkerHealth()));
  } else {
    const server = createWorkerServer();
    server.on('error', (error: NodeJS.ErrnoException) => {
      console.error(
        `Worker failed to listen (${error.code ?? 'UNKNOWN'}). Check WORKER_PORT and other local processes.`,
      );
      process.exitCode = 1;
    });
    server.listen(config.port, config.host, () => {
      console.log(
        `Worker starter http://${config.host}:${config.port}/health — jobs disabled`,
      );
    });
    let closing = false;
    const shutdown = () => {
      if (closing) return;
      closing = true;
      server.close(() => {
        console.log('Worker stopped.');
      });
      server.closeIdleConnections();
      const timeout = setTimeout(() => {
        server.closeAllConnections();
      }, 2000);
      timeout.unref();
    };
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  }
} catch (error) {
  console.error(
    error instanceof Error ? error.message : 'Worker startup failed.',
  );
  process.exitCode = 1;
}
