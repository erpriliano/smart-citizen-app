import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { FinanceOverview } from '@smart-citizen/finance-contracts';

import type { FinanceOverviewClient } from './finance-overview-client';

export const financeOverviewQueryKey = (communityId: string) =>
  ['finance', communityId, 'overview'] as const;

export function useFinanceOverviewQuery(
  client: FinanceOverviewClient,
  communityId: string,
  enabled: boolean,
): UseQueryResult<FinanceOverview, Error> {
  return useQuery({
    queryKey: financeOverviewQueryKey(communityId),
    queryFn: ({ signal }) => client.getOverview(communityId, signal),
    enabled,
    retry: false,
  });
}
