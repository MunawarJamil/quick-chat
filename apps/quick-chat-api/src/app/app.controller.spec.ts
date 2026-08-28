import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();
  });

  describe('getApiInfo', () => {
    it('returns API metadata from the application service', () => {
      const appController = app.get<AppController>(AppController);
      expect(appController.getApiInfo()).toEqual({
        name: 'quick-chat-api',
        version: '1.0.0',
        status: 'ok',
      });
    });
  });
});
