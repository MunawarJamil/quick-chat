import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }
  // This endpoint is for testing the global exception filter and Sentry integration and it is temporary. It should be removed in production.
  @Get('test-error')
  testError() {
    throw new Error('Test Sentry Error');
  }
}
