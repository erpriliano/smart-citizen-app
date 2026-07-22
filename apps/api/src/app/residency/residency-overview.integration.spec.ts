import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { SessionContext } from '@smart-citizen/identity-contracts';
import {
  AdministrativeSessionGuard,
  CommunityScopeGuard,
  IdentitySessionService,
} from '@smart-citizen/identity-api';
import {
  ResidencyOverviewRepository,
  ResidencyOverviewService,
} from '@smart-citizen/residency-api';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { ResidencyOverviewController } from './residency-overview.controller';

const communityId = '40db0b3f-0354-4f47-96df-bac69dc711a9';
const otherCommunityId = '8e219170-e33b-434c-8fc2-e9a9eb7868b1';

function sessionWith(permissions: string[]): SessionContext {
  return {
    user: { id: 'dd7a82c6-1fcc-4d79-82dc-14ad743015b5', email: 'admin@example.test' },
    membershipId: 'a2c8d45d-6cb8-4406-899c-0f54a64d40fd',
    community: {
      id: communityId,
      name: 'RT 05 Taman Warga',
      slug: 'rt-05-taman-warga',
      timezone: 'Asia/Jakarta',
      currency: 'IDR',
    },
    positions: [{ code: 'pak-rt', name: 'Pak RT' }],
    roles: [{ code: 'community-admin', name: 'Community Administrator' }],
    permissions,
  };
}

describe('Residency overview HTTP boundary', () => {
  let app: INestApplication;
  let activeSession = sessionWith(['residency.record.read', 'residency.change.read']);
  const sessions = { readSession: vi.fn() };
  const repository = { getRecords: vi.fn(), getChanges: vi.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ResidencyOverviewController],
      providers: [
        ResidencyOverviewService,
        AdministrativeSessionGuard,
        CommunityScopeGuard,
        { provide: IdentitySessionService, useValue: sessions },
        { provide: ResidencyOverviewRepository, useValue: repository },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    activeSession = sessionWith(['residency.record.read', 'residency.change.read']);
    sessions.readSession.mockImplementation(async () => activeSession);
    repository.getRecords.mockResolvedValue({
      activeHouseCount: 24,
      occupiedHouseCount: 21,
      currentResidentCount: 73,
    });
    repository.getChanges.mockResolvedValue({
      pendingCount: 2,
      recent: [
        {
          id: '3ff0d0eb-cf52-447a-bf88-b33dabcf9916',
          changeType: 'MOVE_IN',
          workflowStage: 'SUBMITTED',
          submittedDateTime: '2026-07-21T08:00:00.000Z',
          updatedDateTime: '2026-07-21T08:00:00.000Z',
        },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns a privacy-safe overview for the authenticated community', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/communities/${communityId}/residency/overview`)
      .set('Cookie', 'smart_citizen_session=signed-session-token')
      .expect(200);

    expect(response.body).toMatchObject({
      records: { activeHouseCount: 24, occupiedHouseCount: 21, currentResidentCount: 73 },
      changes: { pendingCount: 2 },
    });
    expect(JSON.stringify(response.body)).not.toMatch(
      /fullName|contactPhone|reason|privateReviewNote|MembershipId/,
    );
  });

  it('returns generic unauthorised and cross-community responses before repository access', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/communities/${communityId}/residency/overview`)
      .expect(401)
      .expect(({ body }) => expect(body.message).toBe('Your session is no longer valid.'));

    expect(repository.getRecords).not.toHaveBeenCalled();

    await request(app.getHttpServer())
      .get(`/api/v1/communities/${otherCommunityId}/residency/overview`)
      .set('Cookie', 'smart_citizen_session=signed-session-token')
      .expect(403)
      .expect(({ body }) => expect(body.message).toBe('You do not have access to this resource.'));

    expect(repository.getRecords).not.toHaveBeenCalled();
  });

  it('denies an authenticated position without explicit residency permission', async () => {
    activeSession = sessionWith([]);

    await request(app.getHttpServer())
      .get(`/api/v1/communities/${communityId}/residency/overview`)
      .set('Cookie', 'smart_citizen_session=signed-session-token')
      .expect(403)
      .expect(({ body }) => expect(body.message).toBe('You do not have access to this resource.'));

    expect(repository.getRecords).not.toHaveBeenCalled();
    expect(repository.getChanges).not.toHaveBeenCalled();
  });
});
