import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FinanceOverviewRepository, FinanceOverviewService } from '@smart-citizen/finance-api';
import type { SessionContext } from '@smart-citizen/identity-contracts';
import {
  AdministrativeSessionGuard,
  CommunityScopeGuard,
  IdentitySessionService,
  PermissionGuard,
} from '@smart-citizen/identity-api';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { FinanceOverviewController } from './finance-overview.controller';

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

describe('Finance overview HTTP boundary', () => {
  let app: INestApplication;
  let activeSession = sessionWith(['finance.report.read', 'finance.report.approve']);
  const sessions = { readSession: vi.fn() };
  const repository = { getLatestReport: vi.fn(), countApprovalRequired: vi.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [FinanceOverviewController],
      providers: [
        FinanceOverviewService,
        AdministrativeSessionGuard,
        CommunityScopeGuard,
        PermissionGuard,
        { provide: IdentitySessionService, useValue: sessions },
        { provide: FinanceOverviewRepository, useValue: repository },
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
    activeSession = sessionWith(['finance.report.read', 'finance.report.approve']);
    sessions.readSession.mockImplementation(async () => activeSession);
    repository.getLatestReport.mockResolvedValue({
      id: '6e63d35b-c2fa-4225-966c-a71af399eec0',
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
      revisionNumber: 1,
      workflowStage: 'UNDER_REVIEW',
      currency: 'IDR',
      openingBalanceMinor: '9007199254740993',
      incomeTotalMinor: '3000000',
      expenseTotalMinor: '1250000',
      closingBalanceMinor: '9007199256490993',
    });
    repository.countApprovalRequired.mockResolvedValue(1);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns an exact privacy-safe summary for the authenticated community', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/communities/${communityId}/finance/overview`)
      .set('Cookie', 'smart_citizen_session=signed-session-token')
      .expect(200);

    expect(response.body).toMatchObject({
      latestReport: {
        openingBalanceMinor: '9007199254740993',
        closingBalanceMinor: '9007199256490993',
      },
      approvalRequiredCount: 1,
    });
    expect(JSON.stringify(response.body)).not.toMatch(
      /description|entry|evidence|privateNote|MembershipId/,
    );
  });

  it('rejects missing sessions and other communities before repository access', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/communities/${communityId}/finance/overview`)
      .expect(401)
      .expect(({ body }) => expect(body.message).toBe('Your session is no longer valid.'));
    expect(repository.getLatestReport).not.toHaveBeenCalled();

    await request(app.getHttpServer())
      .get(`/api/v1/communities/${otherCommunityId}/finance/overview`)
      .set('Cookie', 'smart_citizen_session=signed-session-token')
      .expect(403)
      .expect(({ body }) => expect(body.message).toBe('You do not have access to this resource.'));
    expect(repository.getLatestReport).not.toHaveBeenCalled();
  });

  it('does not infer read permission from the Pak RT position', async () => {
    activeSession = sessionWith([]);

    await request(app.getHttpServer())
      .get(`/api/v1/communities/${communityId}/finance/overview`)
      .set('Cookie', 'smart_citizen_session=signed-session-token')
      .expect(403)
      .expect(({ body }) => expect(body.message).toBe('You do not have access to this resource.'));

    expect(repository.getLatestReport).not.toHaveBeenCalled();
    expect(repository.countApprovalRequired).not.toHaveBeenCalled();
  });
});
