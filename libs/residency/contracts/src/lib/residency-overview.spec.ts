import { describe, expect, it } from 'vitest';

import { residencyOverviewSchema } from './residency-overview';

const validOverview = {
  records: {
    activeHouseCount: 24,
    occupiedHouseCount: 21,
    currentResidentCount: 73,
  },
  changes: {
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
  },
};

describe('residencyOverviewSchema', () => {
  it('accepts the strict privacy-safe overview contract', () => {
    expect(residencyOverviewSchema.parse(validOverview)).toEqual(validOverview);
    expect(residencyOverviewSchema.parse({ records: null, changes: null })).toEqual({
      records: null,
      changes: null,
    });
  });

  it.each([
    { ...validOverview, records: { ...validOverview.records, activeHouseCount: -1 } },
    {
      ...validOverview,
      changes: {
        ...validOverview.changes,
        recent: Array.from({ length: 6 }, () => validOverview.changes.recent[0]),
      },
    },
    {
      ...validOverview,
      changes: {
        ...validOverview.changes,
        recent: [{ ...validOverview.changes.recent[0], id: 'not-a-uuid' }],
      },
    },
    {
      ...validOverview,
      changes: {
        ...validOverview.changes,
        recent: [{ ...validOverview.changes.recent[0], workflowStage: 'DRAFT' }],
      },
    },
    { ...validOverview, privateResidentName: 'Must not be accepted' },
  ])('rejects malformed or expanded payload %#', (value) => {
    expect(() => residencyOverviewSchema.parse(value)).toThrow();
  });
});
