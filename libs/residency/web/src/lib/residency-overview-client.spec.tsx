import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { HttpClient } from '@smart-citizen/shared-http-client';
import type { PropsWithChildren } from 'react';
import { ZodError } from 'zod';
import { vi } from 'vitest';

import {
  createResidencyOverviewClient,
  type ResidencyOverviewClient,
} from './residency-overview-client';
import { residencyOverviewQueryKey, useResidencyOverviewQuery } from './residency-overview-query';

const communityId = '40db0b3f-0354-4f47-96df-bac69dc711a9';
const overview = {
  records: { activeHouseCount: 24, occupiedHouseCount: 21, currentResidentCount: 73 },
  changes: { pendingCount: 0, recent: [] },
};

describe('residency overview client', () => {
  it('uses explicit community context and forwards cancellation', async () => {
    const signal = new AbortController().signal;
    const httpClient = {
      get: vi.fn().mockResolvedValue({ data: overview }),
    } as unknown as HttpClient;

    await expect(
      createResidencyOverviewClient(httpClient).getOverview(communityId, signal),
    ).resolves.toEqual(overview);
    expect(httpClient.get).toHaveBeenCalledWith(`/communities/${communityId}/residency/overview`, {
      signal,
    });
  });

  it('rejects malformed responses and omits an absent signal', async () => {
    const httpClient = {
      get: vi.fn().mockResolvedValue({ data: { records: { activeHouseCount: '24' } } }),
    } as unknown as HttpClient;

    await expect(
      createResidencyOverviewClient(httpClient).getOverview(communityId),
    ).rejects.toBeInstanceOf(ZodError);
    expect(httpClient.get).toHaveBeenCalledWith(
      `/communities/${communityId}/residency/overview`,
      {},
    );
  });
});

describe('residency overview query', () => {
  it('keeps the explicit key while disabled and does not call the client', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const client = { getOverview: vi.fn() } as ResidencyOverviewClient;
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    renderHook(() => useResidencyOverviewQuery(client, communityId, false), { wrapper });

    expect(residencyOverviewQueryKey(communityId)).toEqual(['residency', communityId, 'overview']);
    expect(
      queryClient.getQueryCache().find({ queryKey: residencyOverviewQueryKey(communityId) }),
    ).toBeDefined();
    expect(client.getOverview).not.toHaveBeenCalled();
  });

  it('passes TanStack Query cancellation to an enabled client', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const client = { getOverview: vi.fn().mockResolvedValue(overview) } as ResidencyOverviewClient;
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useResidencyOverviewQuery(client, communityId, true), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getOverview).toHaveBeenCalledWith(communityId, expect.any(AbortSignal));
  });
});
