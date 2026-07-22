import { lazy, Suspense } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import {
  createFinanceOverviewClient,
  type FinanceOverviewClient,
} from '@smart-citizen/finance-web';
import {
  createIdentityClient,
  IdentityProvider,
  ProtectedRoute,
  SignInPage,
  useSignOutMutation,
  type IdentityClient,
} from '@smart-citizen/identity-web';
import { administrativeRoutePaths } from '@smart-citizen/platform-contracts';
import {
  createResidencyOverviewClient,
  type ResidencyOverviewClient,
} from '@smart-citizen/residency-web';
import { Button, Skeleton } from '@smart-citizen/shared-ui';

import { apiClient } from './http-client';

const ApplicationShell = lazy(async () => {
  const platform = await import('@smart-citizen/platform-web');
  return { default: platform.ApplicationShell };
});

const WeeklyOverviewRoute = lazy(async () => {
  const route = await import('./weekly-overview-route');
  return { default: route.WeeklyOverviewRoute };
});

const productionIdentityClient = createIdentityClient(apiClient);
const productionResidencyClient = createResidencyOverviewClient(apiClient);
const productionFinanceClient = createFinanceOverviewClient(apiClient);

const plannedAdministrativeRoutes = [
  { path: administrativeRoutePaths.houses, title: 'Houses' },
  { path: administrativeRoutePaths.residents, title: 'Residents' },
  { path: administrativeRoutePaths.residencyChanges, title: 'Residency changes' },
  { path: administrativeRoutePaths.financialReports, title: 'Financial reports' },
  {
    path: administrativeRoutePaths.financialReportWorkspace,
    title: 'Financial report workspace',
  },
  { path: administrativeRoutePaths.publications, title: 'Publications' },
  { path: administrativeRoutePaths.team, title: 'Team and access' },
  { path: administrativeRoutePaths.audit, title: 'Audit trail' },
  { path: administrativeRoutePaths.settings, title: 'Community settings' },
] as const;

interface UnavailablePageProps {
  message: string;
  standalone?: boolean;
  title: string;
}

function UnavailablePage({ message, standalone = false, title }: UnavailablePageProps) {
  const content = (
    <section className="max-w-xl py-8">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{message}</p>
    </section>
  );

  if (standalone) {
    return <main className="min-h-screen bg-background px-6 py-12">{content}</main>;
  }

  return content;
}

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
  financeClient?: FinanceOverviewClient;
  identityClient?: IdentityClient;
  residencyClient?: ResidencyOverviewClient;
}

export function App({
  financeClient = productionFinanceClient,
  identityClient = productionIdentityClient,
  residencyClient = productionResidencyClient,
}: AppProps) {
  return (
    <IdentityProvider client={identityClient}>
      <Suspense fallback={<RouteLoadingState />}>
        <Routes>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route
            path="/p/finance/:publicId"
            element={
              <UnavailablePage
                message="This publication is not available yet."
                standalone
                title="Public financial report"
              />
            }
          />
          <Route element={<ProtectedRoute />}>
            <Route element={<AuthenticatedWorkspace />}>
              <Route
                index
                element={
                  <WeeklyOverviewRoute
                    financeClient={financeClient}
                    residencyClient={residencyClient}
                  />
                }
              />
              {plannedAdministrativeRoutes.map((route) => (
                <Route
                  element={
                    <UnavailablePage
                      message="This page is not available yet."
                      title={route.title}
                    />
                  }
                  key={route.path}
                  path={route.path}
                />
              ))}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </IdentityProvider>
  );
}

export default App;
