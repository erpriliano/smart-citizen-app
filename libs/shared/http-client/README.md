# Shared HTTP Client

This library owns standardized Axios transport behavior for browser-facing Smart Citizen code. Import Axios only here; domain web libraries consume the exported factory and application instance.

## Responsibilities

- Configure the base URL, timeout, JSON response preference, and optional bearer token provider.
- Preserve request-specific headers and cancellation signals.
- Preserve Axios cancellation as control flow so TanStack Query can recognize aborted work.
- Normalize Axios failures into `HttpClientError` without retaining request configuration or authorization headers.
- Leave caching, retries, invalidation, and loading state to TanStack Query.

## TanStack Query Usage

Domain API functions keep community context explicit and forward the query signal:

```ts
import type { HttpClient } from '@smart-citizen/shared-http-client';

async function loadCommunity(client: HttpClient, communityId: string, signal: AbortSignal) {
  const response = await client.get(`/communities/${communityId}`, { signal });
  return response.data;
}

function communityQueryOptions(client: HttpClient, communityId: string) {
  return {
    queryKey: ['community', communityId],
    queryFn: ({ signal }: { signal: AbortSignal }) => loadCommunity(client, communityId, signal),
  };
}
```

Validate `response.data` with the owning domain's Zod schema before returning it to UI code. The app composition root passes `apiClient` into `communityQueryOptions`; libraries never import an application.

## Verification

```bash
pnpm exec nx test shared-http-client
pnpm exec nx lint shared-http-client
pnpm exec nx typecheck shared-http-client
```
