import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'quick-chat-api',
      description: 'Quick Chat API is running smoothly.',
      timestamp: new Date().toISOString(),
    };
  }
}
