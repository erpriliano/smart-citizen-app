# Axios HTTP Client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install Axios and provide a tested, standardized frontend HTTP client that composes cleanly with future TanStack Query domain operations.

**Architecture:** A shared `type:web`, `scope:shared` Nx library owns Axios configuration and transport-error normalization. The web application composition root owns the default API instance, while domain web libraries will own endpoint functions and pass TanStack Query cancellation signals into Axios requests.

**Tech Stack:** pnpm 8.15.9, Nx 23.0.1, TypeScript 5.9, Axios, Vitest, React 19, and TanStack Query 5.

## Global Constraints

- Preserve explicit `communityId` arguments for tenant-owned requests; never hide tenancy in a global interceptor.
- Axios performs no retries; TanStack Query owns retry policy.
- Do not introduce token persistence before the identity/session design.
- Do not expose Axios request configuration, authorization headers, or raw credentials through normalized errors.
- Include the user-approved `.prettierrc.json` change in the feature commit.

---

### Task 1: Dependency and Nx Library

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `libs/shared/http-client/**`
- Modify: `tsconfig.base.json`

**Interfaces:**

- Produces: Nx project `shared-http-client` at import path `@smart-citizen/shared-http-client`.

- [ ] **Step 1: Install Axios at the workspace root**

Run: `pnpm add axios@latest -w`

- [ ] **Step 2: Generate the shared library**

Run:

```bash
pnpm exec nx g @nx/js:library libs/shared/http-client \
  --name=shared-http-client \
  --importPath=@smart-citizen/shared-http-client \
  --bundler=none \
  --linter=eslint \
  --unitTestRunner=vitest \
  --testEnvironment=node \
  --tags=scope:shared,type:web \
  --useProjectJson
```

- [ ] **Step 3: Remove generated placeholder behavior and confirm project metadata**

Keep the generated public entry point, test configuration, strict TypeScript configuration, and project tags. Replace placeholder source and tests during Task 2.

### Task 2: Test-Driven Axios Factory

**Files:**

- Create: `libs/shared/http-client/src/lib/http-client.spec.ts`
- Create: `libs/shared/http-client/src/lib/http-client.ts`
- Create: `libs/shared/http-client/src/lib/http-client-error.ts`
- Modify: `libs/shared/http-client/src/index.ts`

**Interfaces:**

- Produces: `createHttpClient(options: CreateHttpClientOptions): AxiosInstance`.
- Produces: `HttpClientError` and `isHttpClientError(error: unknown): error is HttpClientError`.
- `CreateHttpClientOptions` contains `baseURL`, optional `timeoutMs`, and optional `getAccessToken`.

- [ ] **Step 1: Write failing client tests**

Cover the 10-second timeout, JSON accept header, custom headers, synchronous and asynchronous access tokens, and preservation of an explicit request authorization header.

- [ ] **Step 2: Run tests and verify RED**

Run: `pnpm exec nx test shared-http-client --skip-nx-cache`

Expected: FAIL because the public factory and error types do not exist.

- [ ] **Step 3: Implement the minimal client factory**

Use `axios.create`, a request interceptor for optional bearer authentication, and no retry interceptor.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `pnpm exec nx test shared-http-client --skip-nx-cache`

Expected: PASS for configuration and header behavior.

- [ ] **Step 5: Write failing error-normalization tests**

Cover response status/payload, network failures, safe error fields, `isHttpClientError`, and preservation of non-Axios errors.

- [ ] **Step 6: Run tests and verify RED**

Run: `pnpm exec nx test shared-http-client --skip-nx-cache`

Expected: FAIL because response errors are not normalized.

- [ ] **Step 7: Implement error normalization**

Reject Axios failures as `HttpClientError` without retaining the raw `AxiosError` or request config. Reject non-Axios errors unchanged.

- [ ] **Step 8: Run tests and verify GREEN**

Run: `pnpm exec nx test shared-http-client --skip-nx-cache`

Expected: all shared HTTP client tests pass.

### Task 3: Web Composition and Usage Contract

**Files:**

- Create: `apps/web/src/app/http-client.spec.ts`
- Create: `apps/web/src/app/http-client.ts`
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `libs/shared/http-client/README.md`

**Interfaces:**

- Produces: `apiClient`, the web application's standard Axios instance.
- Consumes: `createHttpClient` from `@smart-citizen/shared-http-client`.

- [ ] **Step 1: Write the failing web instance test**

Assert that the application API client uses `VITE_API_URL` and falls back to `/api/v1` when it is absent.

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm exec nx test web --skip-nx-cache`

Expected: FAIL because `http-client.ts` does not exist.

- [ ] **Step 3: Implement the application instance**

Create the client through the shared factory without introducing token storage or tenant-global state.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `pnpm exec nx test web --skip-nx-cache`

Expected: PASS.

- [ ] **Step 5: Document environment and ownership boundaries**

Document `VITE_API_URL`, Axios transport ownership, explicit community context, TanStack Query cancellation, and the rule that application components never call Axios directly.

### Task 4: Verification and Publication

**Files:**

- Include: `.prettierrc.json`
- Include: all files created or modified in Tasks 1-3

- [ ] **Step 1: Format and synchronize Nx metadata**

Run: `pnpm exec nx format:write` and `pnpm exec nx sync:check`.

- [ ] **Step 2: Run focused verification**

Run:

```bash
pnpm exec nx run-many -t lint typecheck test --projects=shared-http-client,web --skip-nx-cache
```

- [ ] **Step 3: Run repository verification**

Run: `pnpm verify`

- [ ] **Step 4: Run integration-adjacent checks**

Run: `pnpm e2e` and `pnpm exec prisma validate`.

- [ ] **Step 5: Inspect the final diff**

Run: `git diff --check` and `git status --short`.

- [ ] **Step 6: Commit and publish**

Commit message: `feat: standardize frontend HTTP client`

Push `agent/standardize-http-client`, then open a concise ready-for-review pull request targeting `main`.
