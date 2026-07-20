import { useSyncExternalStore, type PropsWithChildren } from 'react';
import { MonitorUpIcon } from 'lucide-react';

const ADMINISTRATIVE_VIEWPORT_QUERY = '(min-width: 768px)';

function subscribeToAdministrativeViewport(onStoreChange: () => void): () => void {
  const mediaQuery = window.matchMedia(ADMINISTRATIVE_VIEWPORT_QUERY);
  mediaQuery.addEventListener('change', onStoreChange);

  return () => mediaQuery.removeEventListener('change', onStoreChange);
}

function getAdministrativeViewportSnapshot(): boolean {
  return window.matchMedia(ADMINISTRATIVE_VIEWPORT_QUERY).matches;
}

export function AdministrativeViewportGate({ children }: PropsWithChildren) {
  const isAdministrativeViewport = useSyncExternalStore(
    subscribeToAdministrativeViewport,
    getAdministrativeViewportSnapshot,
    () => false,
  );

  if (!isAdministrativeViewport) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-6 py-12">
        <section className="flex max-w-md flex-col items-center text-center">
          <span className="mb-5 grid size-11 place-items-center rounded-md bg-primary text-primary-foreground">
            <MonitorUpIcon aria-hidden="true" className="size-5" />
          </span>
          <h1 className="text-xl font-semibold text-foreground">
            Continue on a tablet or larger screen
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The administrative workspace is designed for tablet and desktop use.
          </p>
        </section>
      </main>
    );
  }

  return children;
}
