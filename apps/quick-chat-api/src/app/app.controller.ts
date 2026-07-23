import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { AppService } from './app.service';

@SkipThrottle()
@ApiTags('General')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'API info' })
  @ApiOkResponse({ description: 'Returns basic API metadata' })
  getApiInfo() {
    return this.appService.getApiInfo();
  }
}
