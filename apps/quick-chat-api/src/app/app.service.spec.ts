import { Test } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = app.get<AppService>(AppService);
  });

  describe('getData', () => {
    it('returns the shared greeting and sample user', () => {
      expect(service.getData()).toEqual({
        message: 'Hello Shared Utils',
        user: {
          id: '1',
          email: 'test@quickchat.com',
          name: 'Munawar',
        },
      });
    });
  });
});
