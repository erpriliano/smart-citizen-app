import { developmentApiProxy } from '../../vite.config.mts';

describe('web development server', () => {
  it('proxies same-origin API requests to the local NestJS server', () => {
    expect(developmentApiProxy).toEqual({
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    });
  });
});
