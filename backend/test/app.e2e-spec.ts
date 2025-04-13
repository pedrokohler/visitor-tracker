import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import {} from 'rxjs';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    jest.useFakeTimers();
    return request(app.getHttpServer()).get('/').expect(200).expect('Pong!');
  });

  it('/sessions (GET)', () => {
    jest.useFakeTimers();
    return request(app.getHttpServer()).get('/sessions').expect(200).expect([]);
  });
});
