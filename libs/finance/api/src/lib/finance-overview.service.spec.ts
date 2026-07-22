import { randomUUID } from 'node:crypto';
import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { SessionContext } from '@smart-citizen/identity-contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FinanceOverviewRepository } from './finance-overview.repository';
import { FinanceOverviewService } from './finance-overview.service';

const communityId = '40db0b3f-0354-4f47-96df-bac69dc711a9';
const latestReport = {
  id: '6e63d35b-c2fa-4225-966c-a71af399eec0',
  periodStart: '2026-07-01',
  periodEnd: '2026-07-31',
  revisionNumber: 1,
  workflowStage: 'UNDER_REVIEW' as const,
  currency: 'IDR',
  openingBalanceMinor: '12500000',
  incomeTotalMinor: '3000000',
  expenseTotalMinor: '1750000',
  closingBalanceMinor: '13750000',
};

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

describe('FinanceOverviewService', () => {
  const repository = { getLatestReport: vi.fn(), countApprovalRequired: vi.fn() };
  let service: FinanceOverviewService;

  beforeEach(async () => {
    vi.clearAllMocks();
    repository.getLatestReport.mockResolvedValue(latestReport);
    repository.countApprovalRequired.mockResolvedValue(1);
    const moduleRef = await Test.createTestingModule({
      providers: [
        FinanceOverviewService,
        { provide: FinanceOverviewRepository, useValue: repository },
      ],
    }).compile();
    service = moduleRef.get(FinanceOverviewService);
  });

  it('returns the report and approval count for both explicit permissions', async () => {
    await expect(
      service.getOverview(
        sessionWith(['finance.report.read', 'finance.report.approve']),
        communityId,
      ),
    ).resolves.toEqual({ latestReport, approvalRequiredCount: 1 });
  });

  it('does not infer approval visibility from the Pak RT position', async () => {
    await expect(
      service.getOverview(sessionWith(['finance.report.read']), communityId),
    ).resolves.toEqual({ latestReport, approvalRequiredCount: null });
    expect(repository.countApprovalRequired).not.toHaveBeenCalled();
  });

  it('rejects missing read permission and another community before repository access', async () => {
    await expect(service.getOverview(sessionWith([]), communityId)).rejects.toEqual(
      new ForbiddenException('You do not have access to this resource.'),
    );
    await expect(
      service.getOverview(sessionWith(['finance.report.read']), randomUUID()),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.getLatestReport).not.toHaveBeenCalled();
  });
});
