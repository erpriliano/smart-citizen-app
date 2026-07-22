import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { ResidencyOverview } from '@smart-citizen/residency-contracts';

import type { ResidencyOverviewClient } from './residency-overview-client';

export const residencyOverviewQueryKey = (communityId: string) =>
  ['residency', communityId, 'overview'] as const;

export function useResidencyOverviewQuery(
  client: ResidencyOverviewClient,
  communityId: string,
  enabled: boolean,
): UseQueryResult<ResidencyOverview, Error> {
  return useQuery({
    queryKey: residencyOverviewQueryKey(communityId),
    queryFn: ({ signal }) => client.getOverview(communityId, signal),
    enabled,
    retry: false,
  });
}
