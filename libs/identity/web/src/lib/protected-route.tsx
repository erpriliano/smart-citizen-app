import { Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom';
import type { SessionContext } from '@smart-citizen/identity-contracts';
import { isHttpClientError } from '@smart-citizen/shared-http-client';
import { Alert, AlertDescription, AlertTitle, Button, Skeleton } from '@smart-citizen/shared-ui';

import { useSessionQuery } from './session-query';

export function ProtectedRoute() {
  const location = useLocation();
  const sessionQuery = useSessionQuery();

  if (sessionQuery.isPending) {
    return (
      <main
        aria-busy="true"
        aria-label="Loading administrative workspace"
        className="grid min-h-screen place-items-center bg-background px-6"
      >
        <div className="flex w-full max-w-sm flex-col gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </main>
    );
  }

  if (isHttpClientError(sessionQuery.error) && sessionQuery.error.status === 401) {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/sign-in" replace state={{ from }} />;
  }

  if (sessionQuery.isError) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-6">
        <Alert className="max-w-md" variant="destructive">
          <AlertTitle>The workspace could not be loaded.</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-4">
            Check your connection and try again.
            <Button variant="outline" onClick={() => void sessionQuery.refetch()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  return <Outlet context={sessionQuery.data} />;
}

export function useAdministrativeSession(): SessionContext {
  return useOutletContext<SessionContext>();
}
