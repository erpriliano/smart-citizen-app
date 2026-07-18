import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns the stable service health payload', () => {
    const controller = new HealthController();

    expect(controller.getHealth()).toEqual({
      status: 'ok',
      service: 'smart-citizen-api',
    });
  });
});
