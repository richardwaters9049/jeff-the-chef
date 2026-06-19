// Starts the Jeff backend with validated host, port, and privacy-safe logging settings.
import { readConfig } from './config.js';
import { buildServer } from './server.js';

const config = readConfig();
const server = buildServer({ logger: { level: config.LOG_LEVEL } });

try {
  await server.listen({ host: config.HOST, port: config.PORT });
} catch (error) {
  server.log.error(error);
  process.exitCode = 1;
}
