import { ZodError } from 'zod';
import { parseEnvironment } from './shared-configuration';

describe('parseEnvironment', () => {
  it('parses and types the required runtime configuration', () => {
    expect(
      parseEnvironment({
        NODE_ENV: 'test',
        PORT: '3000',
        DATABASE_URL: 'postgresql://localhost/test',
        WEB_ORIGIN: 'http://localhost:4200',
        AUTH_SESSION_SECRET: 'a'.repeat(32),
        AUTH_SESSION_TTL_SECONDS: '3600',
        AUTH_COOKIE_SECURE: 'true',
      }),
    ).toEqual({
      NODE_ENV: 'test',
      PORT: 3000,
      DATABASE_URL: 'postgresql://localhost/test',
      WEB_ORIGIN: 'http://localhost:4200',
      AUTH_SESSION_SECRET: 'a'.repeat(32),
      AUTH_SESSION_TTL_SECONDS: 3600,
      AUTH_COOKIE_SECURE: true,
    });
  });

  it('uses safe session defaults outside production', () => {
    expect(
      parseEnvironment({
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://localhost/test',
        WEB_ORIGIN: 'http://localhost:4200',
        AUTH_SESSION_SECRET: 'a'.repeat(32),
      }),
    ).toMatchObject({
      AUTH_SESSION_TTL_SECONDS: 28_800,
      AUTH_COOKIE_SECURE: false,
    });
  });

  it('rejects invalid ports, empty database URLs, and short session secrets', () => {
    expect(() =>
      parseEnvironment({
        NODE_ENV: 'test',
        PORT: 'invalid',
        DATABASE_URL: '',
        WEB_ORIGIN: 'http://localhost:4200',
        AUTH_SESSION_SECRET: 'short',
      }),
    ).toThrow(ZodError);
  });
});
