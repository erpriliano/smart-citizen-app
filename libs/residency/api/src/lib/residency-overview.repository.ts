import type { ResidencyOverview } from '@smart-citizen/residency-contracts';

export type ResidencyRecordSummary = NonNullable<ResidencyOverview['records']>;
export type ResidencyChangeSummary = NonNullable<ResidencyOverview['changes']>;

export abstract class ResidencyOverviewRepository {
  abstract getRecords(communityId: string, localDate: Date): Promise<ResidencyRecordSummary>;
  abstract getChanges(communityId: string): Promise<ResidencyChangeSummary>;
}
