// Validates backend environment variables before the HTTP service starts.
import { z } from 'zod';

const ConfigSchema = z.object({
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(8787),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
});

export type BackendConfig = z.infer<typeof ConfigSchema>;

export function readConfig(
  environment: NodeJS.ProcessEnv = process.env,
): BackendConfig {
  return ConfigSchema.parse(environment);
}
