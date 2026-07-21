import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import type { SessionContext } from '@smart-citizen/identity-contracts';
import cookieParser = require('cookie-parser');
import request = require('supertest');
import { vi } from 'vitest';

import { IdentitySessionController } from './identity-session.controller';
import {
  IdentitySessionService,
  InvalidCredentialsError,
  InvalidSessionError,
} from './identity-session.service';

const session: SessionContext = {
  user: {
    id: 'dd7a82c6-1fcc-4d79-82dc-14ad743015b5',
    email: 'admin@example.test',
  },
  membershipId: 'a2c8d45d-6cb8-4406-899c-0f54a64d40fd',
  community: {
    id: '40db0b3f-0354-4f47-96df-bac69dc711a9',
    name: 'RT 05 Taman Warga',
    slug: 'rt-05-taman-warga',
    timezone: 'Asia/Jakarta',
    currency: 'IDR',
  },
  positions: [{ code: 'pak-rt', name: 'Pak RT' }],
  roles: [{ code: 'community-admin', name: 'Community Administrator' }],
  permissions: ['community.read', 'finance.approve'],
};

describe('Identity session HTTP boundary', () => {
  let app: INestApplication;
  const sessionService = {
    signIn: vi.fn(),
    readSession: vi.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [IdentitySessionController],
      providers: [
        { provide: IdentitySessionService, useValue: sessionService },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              const values: Record<string, unknown> = {
                AUTH_SESSION_TTL_SECONDS: 3600,
                AUTH_COOKIE_SECURE: false,
              };
              return values[key];
            },
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    sessionService.signIn.mockResolvedValue({
      session,
      token: 'signed-session-token',
    });
    sessionService.readSession.mockResolvedValue(session);
  });

  afterAll(async () => {
    await app.close();
  });

  it('sets an HTTP-only SameSite session cookie and returns only safe context', async () => {
    const response = await request(app.getHttpServer()).post('/api/v1/identity/session').send({
      email: 'ADMIN@EXAMPLE.TEST',
      password: 'correct horse battery staple',
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(session);
    expect(response.body).not.toHaveProperty('token');
    expect(response.body).not.toHaveProperty('passwordHash');
    expect(response.headers['set-cookie']?.[0]).toContain(
      'smart_citizen_session=signed-session-token',
    );
    expect(response.headers['set-cookie']?.[0]).toContain('Max-Age=3600');
    expect(response.headers['set-cookie']?.[0]).toContain('Path=/api/v1');
    expect(response.headers['set-cookie']?.[0]).toContain('HttpOnly');
    expect(response.headers['set-cookie']?.[0]).toContain('SameSite=Lax');
    expect(sessionService.signIn).toHaveBeenCalledWith({
      email: 'admin@example.test',
      password: 'correct horse battery staple',
    });
  });

  it('returns one safe unauthorised response for invalid credentials', async () => {
    sessionService.signIn.mockRejectedValue(new InvalidCredentialsError());

    await request(app.getHttpServer())
      .post('/api/v1/identity/session')
      .send({ email: 'missing@example.test', password: 'incorrect password' })
      .expect(401)
      .expect(({ body }) => {
        expect(body.message).toBe('Email or password is incorrect.');
        expect(JSON.stringify(body)).not.toContain('missing@example.test');
      });
  });

  it('rejects unexpected privileged input at the DTO boundary', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/identity/session')
      .send({
        email: 'admin@example.test',
        password: 'correct horse battery staple',
        communityId: session.community.id,
        permission: 'finance.approve',
      })
      .expect(400);

    expect(sessionService.signIn).not.toHaveBeenCalled();
  });

  it('re-resolves the current session from the HTTP-only cookie', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/identity/session')
      .set('Cookie', 'smart_citizen_session=signed-session-token')
      .expect(200)
      .expect(session);

    expect(sessionService.readSession).toHaveBeenCalledWith('signed-session-token');
  });

  it('returns a safe response for an absent or invalid session', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/identity/session')
      .expect(401)
      .expect(({ body }) => {
        expect(body.message).toBe('Your session is no longer valid.');
      });

    sessionService.readSession.mockRejectedValue(new InvalidSessionError());

    await request(app.getHttpServer())
      .get('/api/v1/identity/session')
      .set('Cookie', 'smart_citizen_session=invalid-token')
      .expect(401)
      .expect(({ body }) => {
        expect(body.message).toBe('Your session is no longer valid.');
      });
  });

  it('clears the scoped session cookie on sign-out', async () => {
    const response = await request(app.getHttpServer()).delete('/api/v1/identity/session');

    expect(response.status).toBe(204);
    expect(response.headers['set-cookie']?.[0]).toContain('smart_citizen_session=;');
    expect(response.headers['set-cookie']?.[0]).toContain('Path=/api/v1');
    expect(response.headers['set-cookie']?.[0]).toContain('HttpOnly');
  });
});
