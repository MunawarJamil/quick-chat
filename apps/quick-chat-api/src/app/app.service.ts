import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getApiInfo(): { name: string; version: string; status: string } {
    return {
      name: 'quick-chat-api',
      version: '1.0.0',
      status: 'ok',
    };
  }
}
