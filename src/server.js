import 'dotenv/config';
import { loadEnv } from './config/env.js';
import { createApp } from './app.js';

export function startServer() {
  const env = loadEnv(process.env);
  const app = createApp({ corsOrigins: env.CORS_ORIGINS });

  const server = app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`HelpDesk BQ listening on port ${env.PORT}`);
  });

  function shutdown() {
    server.close(() => process.exit(0));
  }

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return server;
}

if (process.argv[1]?.endsWith('server.js')) {
  startServer();
}
