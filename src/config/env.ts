import { z } from 'zod';

const envSchema = z.object({
  APP_NAME: z.string().min(1).default('carrier-integration-service'),
  UPS_CLIENT_ID: z.string().min(1, 'UPS_CLIENT_ID is required'),
  UPS_CLIENT_SECRET: z.string().min(1, 'UPS_CLIENT_SECRET is required'),
  UPS_BASE_URL: z.string().url().default('https://wwwcie.ups.com'),
  UPS_RATE_PATH: z.string().min(1).default('/api/rating/v2403/Shop'),
  HTTP_TIMEOUT_MS: z.coerce.number().positive().default(10_000),
  RETRY_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(3),
  RETRY_BASE_DELAY_MS: z.coerce.number().nonnegative().default(100),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(): Config {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const problems = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }

  return result.data;
}
