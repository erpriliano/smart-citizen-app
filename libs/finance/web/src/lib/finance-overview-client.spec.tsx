import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { HttpClient } from '@smart-citizen/shared-http-client';
import type { PropsWithChildren } from 'react';
import { ZodError } from 'zod';
import { vi } from 'vitest';

import { createFinanceOverviewClient, type FinanceOverviewClient } from './finance-overview-client';
import { financeOverviewQueryKey, useFinanceOverviewQuery } from './finance-overview-query';

const communityId = '40db0b3f-0354-4f47-96df-bac69dc711a9';
const overview = {
  latestReport: {
    id: '6e63d35b-c2fa-4225-966c-a71af399eec0',
    periodStart: '2026-07-01',
    periodEnd: '2026-07-31',
    revisionNumber: 1,
    workflowStage: 'UNDER_REVIEW' as const,
    currency: 'IDR',
    openingBalanceMinor: '12500000',
    incomeTotalMinor: '3000000',
    expenseTotalMinor: '1750000',
    closingBalanceMinor: '13750000',
  },
  approvalRequiredCount: 1,
};

describe('finance overview client', () => {
  it('uses explicit community context and forwards cancellation', async () => {
    const signal = new AbortController().signal;
    const httpClient = {
      get: vi.fn().mockResolvedValue({ data: overview }),
    } as unknown as HttpClient;

    await expect(
      createFinanceOverviewClient(httpClient).getOverview(communityId, signal),
    ).resolves.toEqual(overview);
    expect(httpClient.get).toHaveBeenCalledWith(`/communities/${communityId}/finance/overview`, {
      signal,
    });
  });

  it('rejects malformed responses and omits an absent signal', async () => {
    const httpClient = {
      get: vi.fn().mockResolvedValue({ data: { latestReport: { openingBalanceMinor: 12 } } }),
    } as unknown as HttpClient;

    await expect(
      createFinanceOverviewClient(httpClient).getOverview(communityId),
    ).rejects.toBeInstanceOf(ZodError);
    expect(httpClient.get).toHaveBeenCalledWith(`/communities/${communityId}/finance/overview`, {});
  });
});

describe('finance overview query', () => {
  it('keeps the explicit key while disabled and does not call the client', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const client = { getOverview: vi.fn() } as FinanceOverviewClient;
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    renderHook(() => useFinanceOverviewQuery(client, communityId, false), { wrapper });

    expect(financeOverviewQueryKey(communityId)).toEqual(['finance', communityId, 'overview']);
    expect(
      queryClient.getQueryCache().find({ queryKey: financeOverviewQueryKey(communityId) }),
    ).toBeDefined();
    expect(client.getOverview).not.toHaveBeenCalled();
  });

  it('passes TanStack Query cancellation to an enabled client', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const client = { getOverview: vi.fn().mockResolvedValue(overview) } as FinanceOverviewClient;
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useFinanceOverviewQuery(client, communityId, true), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getOverview).toHaveBeenCalledWith(communityId, expect.any(AbortSignal));
  });
});
