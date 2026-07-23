import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),

  // Redis
  REDIS_HOST: z.string().min(1, 'REDIS_HOST is required'),
  REDIS_PORT: z
    .string()
    .regex(/^\d+$/, 'REDIS_PORT must be a number')
    .default('6379'),

  // JWT
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN_DAYS: z
    .string()
    .regex(/^\d+$/, 'JWT_REFRESH_EXPIRES_IN_DAYS must be a number')
    .default('7'),

  // App
  PORT: z.string().regex(/^\d+$/).default('3000'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  APP_ENV: z
    .enum(['development', 'staging', 'production'])
    .default('development'),

  // Sentry (optional — app works without it)
  SENTRY_DSN: z.string().url().optional(),
   
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.issues
      .map((e) => `  ✗ ${e.path.join('.')}: ${e.message}`)
      .join('\n');

    throw new Error(`\n[Config] Environment validation failed:\n${errors}\n`);
  }

  return result.data;
}
