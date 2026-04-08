import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppController } from './../src/app.controller';
import { AppService } from './../src/app.service';
import { ResponseInterceptor } from './../src/common/interceptors/response.interceptor';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer()).get('/').expect(200).expect({
      data: 'Hello World!',
      meta: {},
    });
  });

  it('/health (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);
    const body = response.body as {
      data: {
        status: string;
        timestamp: string;
      };
      meta: Record<string, never>;
    };

    expect(body).toMatchObject({
      data: {
        status: 'ok',
      },
      meta: {},
    });
    expect(typeof body.data.timestamp).toBe('string');
  });
});
