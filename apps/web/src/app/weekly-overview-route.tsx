import { useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import type { FinanceOverview } from '@smart-citizen/finance-contracts';
import {
  financeOverviewQueryKey,
  useFinanceOverviewQuery,
  type FinanceOverviewClient,
} from '@smart-citizen/finance-web';
import type { SessionContext } from '@smart-citizen/identity-contracts';
import type { ResidencyOverview } from '@smart-citizen/residency-contracts';
import {
  residencyOverviewQueryKey,
  useResidencyOverviewQuery,
  type ResidencyOverviewClient,
} from '@smart-citizen/residency-web';
import { lazy } from 'react';
import { useOutletContext } from 'react-router-dom';

type RouteSectionState<T> =
  | { status: 'loading' }
  | { status: 'error'; retry: () => void }
  | { status: 'ready'; data: T };

const WeeklyOverviewPage = lazy(async () => {
  const platform = await import('@smart-citizen/platform-web');
  return { default: platform.WeeklyOverviewPage };
});

function toSectionState<T>(query: UseQueryResult<T, Error>): RouteSectionState<T> {
  if (query.isPending) return { status: 'loading' };
  if (query.isError) return { status: 'error', retry: () => void query.refetch() };
  return { status: 'ready', data: query.data };
}

export interface WeeklyOverviewRouteProps {
  financeClient: FinanceOverviewClient;
  residencyClient: ResidencyOverviewClient;
}

export function WeeklyOverviewRoute({ financeClient, residencyClient }: WeeklyOverviewRouteProps) {
  const session = useOutletContext<SessionContext>();
  const queryClient = useQueryClient();
  const permissions = new Set(session.permissions);
  const canReadResidency =
    permissions.has('residency.record.read') || permissions.has('residency.change.read');
  const canReadFinance = permissions.has('finance.report.read');
  const communityId = session.community.id;
  const residencyQuery = useResidencyOverviewQuery(residencyClient, communityId, canReadResidency);
  const financeQuery = useFinanceOverviewQuery(financeClient, communityId, canReadFinance);

  const handleRefresh = () => {
    const invalidations: Promise<void>[] = [];
    if (canReadResidency) {
      invalidations.push(
        queryClient.invalidateQueries({ queryKey: residencyOverviewQueryKey(communityId) }),
      );
    }
    if (canReadFinance) {
      invalidations.push(
        queryClient.invalidateQueries({ queryKey: financeOverviewQueryKey(communityId) }),
      );
    }
    void Promise.all(invalidations);
  };

  return (
    <WeeklyOverviewPage
      finance={canReadFinance ? toSectionState<FinanceOverview>(financeQuery) : null}
      isRefreshing={
        (canReadResidency && residencyQuery.isRefetching) ||
        (canReadFinance && financeQuery.isRefetching)
      }
      onRefresh={handleRefresh}
      residency={canReadResidency ? toSectionState<ResidencyOverview>(residencyQuery) : null}
      session={session}
    />
  );
}

export default WeeklyOverviewRoute;
