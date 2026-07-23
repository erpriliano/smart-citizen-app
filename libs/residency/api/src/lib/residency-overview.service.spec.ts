import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { SessionContext } from '@smart-citizen/identity-contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ResidencyOverviewRepository } from './residency-overview.repository';
import { ResidencyOverviewService } from './residency-overview.service';

const communityId = '40db0b3f-0354-4f47-96df-bac69dc711a9';
const recordSummary = {
  activeHouseCount: 24,
  occupiedHouseCount: 21,
  currentResidentCount: 73,
};
const changeSummary = {
  pendingCount: 2,
  recent: [
    {
      id: '3ff0d0eb-cf52-447a-bf88-b33dabcf9916',
      changeType: 'MOVE_IN' as const,
      workflowStage: 'SUBMITTED' as const,
      submittedDateTime: '2026-07-21T08:00:00.000Z',
      updatedDateTime: '2026-07-21T08:00:00.000Z',
    },
  ],
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

describe('ResidencyOverviewService', () => {
  const repository = {
    getRecords: vi.fn(),
    getChanges: vi.fn(),
  };
  let service: ResidencyOverviewService;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-21T18:00:00.000Z'));
    vi.clearAllMocks();
    repository.getRecords.mockResolvedValue(recordSummary);
    repository.getChanges.mockResolvedValue(changeSummary);

    const moduleRef = await Test.createTestingModule({
      providers: [
        ResidencyOverviewService,
        { provide: ResidencyOverviewRepository, useValue: repository },
      ],
    }).compile();
    service = moduleRef.get(ResidencyOverviewService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts both permitted facets with the community-local civil date', async () => {
    await expect(
      service.getOverview(
        sessionWith(['residency.record.read', 'residency.change.read']),
        communityId,
      ),
    ).resolves.toEqual({ records: recordSummary, changes: changeSummary });

    expect(repository.getRecords).toHaveBeenCalledWith(
      communityId,
      new Date('2026-07-22T00:00:00.000Z'),
    );
    expect(repository.getChanges).toHaveBeenCalledWith(communityId);
  });

  it('queries and returns only facets granted by explicit permissions', async () => {
    await expect(
      service.getOverview(sessionWith(['residency.record.read']), communityId),
    ).resolves.toEqual({ records: recordSummary, changes: null });
    expect(repository.getChanges).not.toHaveBeenCalled();

    vi.clearAllMocks();
    repository.getChanges.mockResolvedValue(changeSummary);
    await expect(
      service.getOverview(sessionWith(['residency.change.read']), communityId),
    ).resolves.toEqual({ records: null, changes: changeSummary });
    expect(repository.getRecords).not.toHaveBeenCalled();
  });

  it('rejects callers without residency permissions regardless of position', async () => {
    await expect(service.getOverview(sessionWith([]), communityId)).rejects.toEqual(
      new ForbiddenException('You do not have access to this resource.'),
    );
    expect(repository.getRecords).not.toHaveBeenCalled();
    expect(repository.getChanges).not.toHaveBeenCalled();
  });
});
