import { z } from 'zod';

const DEFAULT_ORIGINS = 'http://localhost:5500,http://127.0.0.1:5500';
const DEV_JWT_SECRET = 'dev-only-secret-change-in-production-0123456789';

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: z.string().min(1).optional(),
    CORS_ORIGIN: z.string().min(1).default(DEFAULT_ORIGINS),
    JWT_SECRET: z.string().min(1).optional(),
    JWT_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/).default('1h'),
    BCRYPT_COST: z.coerce.number().int().min(4).max(15).default(12),
  })
  .transform((raw) => ({
    NODE_ENV: raw.NODE_ENV,
    PORT: raw.PORT,
    DATABASE_URL: raw.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/helpdesk',
    CORS_ORIGINS: raw.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean),
    JWT_SECRET: raw.JWT_SECRET ?? DEV_JWT_SECRET,
    JWT_EXPIRES_IN: raw.JWT_EXPIRES_IN,
    BCRYPT_COST: raw.BCRYPT_COST,
  }))
  .refine((env) => env.NODE_ENV !== 'production' || !env.DATABASE_URL.includes('localhost:5432/helpdesk'), {
    message: 'DATABASE_URL is required in production',
    path: ['DATABASE_URL'],
  })
  .refine((env) => env.NODE_ENV !== 'production' || (env.JWT_SECRET && env.JWT_SECRET !== DEV_JWT_SECRET && env.JWT_SECRET.length >= 32), {
    message: 'JWT_SECRET with at least 32 chars is required in production',
    path: ['JWT_SECRET'],
  });

export function loadEnv(source = process.env) {
  return envSchema.parse({
    NODE_ENV: source.NODE_ENV,
    PORT: source.PORT,
    DATABASE_URL: source.DATABASE_URL,
    CORS_ORIGIN: source.CORS_ORIGIN,
    JWT_SECRET: source.JWT_SECRET,
    JWT_EXPIRES_IN: source.JWT_EXPIRES_IN,
    BCRYPT_COST: source.BCRYPT_COST,
  });
}
