import { lazy, Suspense } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import {
  createIdentityClient,
  IdentityProvider,
  ProtectedRoute,
  SignInPage,
  useSignOutMutation,
  type IdentityClient,
} from '@smart-citizen/identity-web';
import { Button, Skeleton } from '@smart-citizen/shared-ui';

import { apiClient } from './http-client';

const ApplicationShell = lazy(async () => {
  const platform = await import('@smart-citizen/platform-web');
  return { default: platform.ApplicationShell };
});

const WeeklyOverviewPage = lazy(async () => {
  const platform = await import('@smart-citizen/platform-web');
  return { default: platform.WeeklyOverviewPage };
});

const productionIdentityClient = createIdentityClient(apiClient);

function RouteLoadingState() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading page"
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

function AuthenticatedWorkspace() {
  const signOut = useSignOutMutation();

  return <ApplicationShell onSignOut={() => signOut.mutateAsync()} />;
}

function NotFoundPage() {
  return (
    <section className="max-w-xl py-8">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="mt-2 text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        This page is not available in the administrative workspace.
      </p>
      <Button className="mt-6" nativeButton={false} render={<Link to="/" />} variant="outline">
        Return to overview
      </Button>
    </section>
  );
}

export interface AppProps {
  identityClient?: IdentityClient;
}

export function App({ identityClient = productionIdentityClient }: AppProps) {
  return (
    <IdentityProvider client={identityClient}>
      <Suspense fallback={<RouteLoadingState />}>
        <Routes>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AuthenticatedWorkspace />}>
              <Route index element={<WeeklyOverviewPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </IdentityProvider>
  );
}

export default App;
