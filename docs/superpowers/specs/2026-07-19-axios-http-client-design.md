# Axios HTTP Client Design

## Purpose

Standardize frontend HTTP transport before domain API integrations begin. Axios will own request and response transport behavior while TanStack Query remains responsible for server-state caching, retries, deduplication, loading state, and invalidation.

## Architecture

Create `libs/shared/http-client` as browser infrastructure tagged `scope:shared` and `type:web`. It is the only shared module that imports Axios directly and exposes:

- `createHttpClient(options)`, which returns a configured `AxiosInstance`.
- `HttpClientError`, a stable error type without Axios request configuration or authorization headers.
- `isHttpClientError(error)`, for safe error narrowing.

The web composition root creates the application instance in `apps/web/src/app/http-client.ts`. Domain API modules in `libs/<domain>/web` will receive the shared `HttpClient` type through query-option or service factories, validate response bodies with Zod, and expose domain-specific operations to TanStack Query hooks. Libraries never import the web application.

## Client Behavior

- Require a non-empty `baseURL` when creating a client.
- Use a 10-second default timeout unless explicitly overridden.
- Send `Accept: application/json` by default.
- Accept an optional synchronous or asynchronous access-token provider.
- Add `Authorization: Bearer <token>` only when the provider returns a token.
- Preserve request-level headers and Axios `AbortSignal` support.
- Preserve Axios cancellation unchanged so TanStack Query can recognize aborted work.
- Normalize Axios failures into `HttpClientError` with safe `status`, `code`, response payload, and network-error metadata.
- Preserve non-Axios errors without wrapping them.
- Do not retry requests in Axios. TanStack Query owns retry policy.
- Do not attach community context globally. Tenant-owned domain functions must accept `communityId` explicitly and attach the agreed request context per operation.

## Web Instance

The web instance uses `VITE_API_URL`, falling back to `/api/v1` for same-origin deployments. `.env.example` documents `VITE_API_URL=http://localhost:3000/api/v1` for separate local web and API servers.

No token storage strategy is introduced in this change. The instance is ready to receive a token provider when the identity feature defines session ownership.

## TanStack Query Compatibility

The shared client does not import TanStack Query. A future query function passes TanStack Query's `signal` directly into an Axios request:

```ts
queryFn: ({ signal }) => loadCommunity(apiClient, communityId, signal);
```

This keeps transport reusable and lets TanStack Query cancel obsolete requests without coupling the two libraries.

## Testing

Vitest tests use a custom Axios adapter so no network or implementation mock is required. Tests cover defaults, token injection, request-header preservation, error normalization, non-Axios error preservation, and cancellation-compatible request configuration. The web instance receives a focused test for environment-based base URL composition.

## Documentation

Update the root README and engineering guide to name Axios as the standard frontend transport and document the ownership boundary between Axios, domain clients, and TanStack Query.
