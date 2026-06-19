import { hello } from './quick-chat-shared-utils.js';

describe('hello', () => {
  it('returns the shared greeting', () => {
    expect(hello()).toEqual('Hello Shared Utils');
  });
});
