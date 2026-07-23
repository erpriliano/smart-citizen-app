import { financeOverviewSchema, type FinanceOverview } from '@smart-citizen/finance-contracts';
import type { HttpClient } from '@smart-citizen/shared-http-client';

export interface FinanceOverviewClient {
  getOverview(communityId: string, signal?: AbortSignal): Promise<FinanceOverview>;
}

export function createFinanceOverviewClient(httpClient: HttpClient): FinanceOverviewClient {
  return {
    async getOverview(communityId, signal) {
      const response = await httpClient.get<FinanceOverview>(
        `/communities/${communityId}/finance/overview`,
        { ...(signal ? { signal } : {}) },
      );

      return financeOverviewSchema.parse(response.data);
    },
  };
}
