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
      }),
    ).toEqual({
      NODE_ENV: 'test',
      PORT: 3000,
      DATABASE_URL: 'postgresql://localhost/test',
      WEB_ORIGIN: 'http://localhost:4200',
    });
  });

  it('rejects invalid ports and empty database URLs', () => {
    expect(() =>
      parseEnvironment({
        NODE_ENV: 'test',
        PORT: 'invalid',
        DATABASE_URL: '',
        WEB_ORIGIN: 'http://localhost:4200',
      }),
    ).toThrow(ZodError);
  });
});
