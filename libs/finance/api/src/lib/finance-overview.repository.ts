import type { FinanceOverview } from '@smart-citizen/finance-contracts';

export type LatestFinanceReport = NonNullable<FinanceOverview['latestReport']>;

export abstract class FinanceOverviewRepository {
  abstract getLatestReport(communityId: string): Promise<LatestFinanceReport | null>;
  abstract countApprovalRequired(communityId: string): Promise<number>;
}
