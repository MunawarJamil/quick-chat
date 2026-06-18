import { Injectable } from '@nestjs/common';
import { hello } from '@quick-chat/quick-chat-shared-utils';
import type { UserDto } from '@quick-chat/quick-chat-shared-types';

@Injectable()
export class AppService {
  getData(): { message: string; user: UserDto } {
    return {
      message: hello(),
      user: {
        id: '1',
        email: 'test@quickchat.com',
        name: 'Munawar',
      },
    };
  }
}
