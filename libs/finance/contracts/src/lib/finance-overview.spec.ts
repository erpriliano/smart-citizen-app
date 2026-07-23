import { describe, expect, it } from 'vitest';

import { financeOverviewSchema } from './finance-overview';

const validOverview = {
  latestReport: {
    id: '6e63d35b-c2fa-4225-966c-a71af399eec0',
    periodStart: '2026-07-01',
    periodEnd: '2026-07-31',
    revisionNumber: 1,
    workflowStage: 'UNDER_REVIEW',
    currency: 'IDR',
    openingBalanceMinor: '12500000',
    incomeTotalMinor: '3000000',
    expenseTotalMinor: '1750000',
    closingBalanceMinor: '13750000',
  },
  approvalRequiredCount: 1,
};

describe('financeOverviewSchema', () => {
  it('accepts exact minor-unit strings and nullable states', () => {
    expect(financeOverviewSchema.parse(validOverview)).toEqual(validOverview);
    expect(
      financeOverviewSchema.parse({ latestReport: null, approvalRequiredCount: null }),
    ).toEqual({ latestReport: null, approvalRequiredCount: null });
  });

  it.each([
    {
      ...validOverview,
      latestReport: { ...validOverview.latestReport, id: 'not-a-uuid' },
    },
    {
      ...validOverview,
      latestReport: { ...validOverview.latestReport, periodStart: '01-07-2026' },
    },
    {
      ...validOverview,
      latestReport: { ...validOverview.latestReport, workflowStage: 'PUBLISHED' },
    },
    {
      ...validOverview,
      latestReport: { ...validOverview.latestReport, currency: 'idr' },
    },
    {
      ...validOverview,
      latestReport: { ...validOverview.latestReport, openingBalanceMinor: 12_500_000 },
    },
    { ...validOverview, approvalRequiredCount: -1 },
    { ...validOverview, approvalPrivateNote: 'Must not be accepted' },
  ])('rejects malformed or expanded payload %#', (value) => {
    expect(() => financeOverviewSchema.parse(value)).toThrow();
  });
});
