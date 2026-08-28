import type { UserDto } from './quick-chat-shared-types.js';

describe('UserDto', () => {
  it('describes a user', () => {
    const user: UserDto = {
      id: '1',
      email: 'test@quickchat.com',
      name: 'Munawar',
    };

    expect(user).toEqual({
      id: '1',
      email: 'test@quickchat.com',
      name: 'Munawar',
    });
  });
});
