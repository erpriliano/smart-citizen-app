import {
  residencyOverviewSchema,
  type ResidencyOverview,
} from '@smart-citizen/residency-contracts';
import type { HttpClient } from '@smart-citizen/shared-http-client';

export interface ResidencyOverviewClient {
  getOverview(communityId: string, signal?: AbortSignal): Promise<ResidencyOverview>;
}

export function createResidencyOverviewClient(httpClient: HttpClient): ResidencyOverviewClient {
  return {
    async getOverview(communityId, signal) {
      const response = await httpClient.get<ResidencyOverview>(
        `/communities/${communityId}/residency/overview`,
        { ...(signal ? { signal } : {}) },
      );

      return residencyOverviewSchema.parse(response.data);
    },
  };
}
