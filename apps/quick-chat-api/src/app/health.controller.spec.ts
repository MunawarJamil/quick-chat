import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  it('returns the API health status', () => {
    const controller = new HealthController();

    expect(controller.check()).toEqual({
      status: 'ok',
      service: 'quick-chat-api',
      description: 'Quick Chat API is running smoothly.',
      timestamp: expect.any(String),
    });
  });
});
