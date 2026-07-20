import { z } from 'zod';

const optionalText = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(1).optional(),
);

const optionalUrl = z.preprocess((value) => (value === '' ? undefined : value), z.url().optional());

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  DATABASE_URL: z.string().regex(/^postgres(?:ql)?:\/\//, 'DATABASE_URL must use PostgreSQL.'),
  WEB_ORIGIN: z.url(),
  AUTH_SESSION_SECRET: z.string().min(32),
  AUTH_SESSION_TTL_SECONDS: z.coerce.number().int().min(300).max(86_400).default(28_800),
  AUTH_COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  S3_ENDPOINT: optionalUrl,
  S3_BUCKET: optionalText,
  S3_REGION: optionalText,
  S3_ACCESS_KEY_ID: optionalText,
  S3_SECRET_ACCESS_KEY: optionalText,
});

export type Environment = z.infer<typeof environmentSchema>;

export function parseEnvironment(input: Record<string, unknown>): Environment {
  return environmentSchema.parse(input);
}
