import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useOutletContext } from 'react-router-dom';
import { LogOutIcon, UserRoundIcon } from 'lucide-react';
import type { SessionContext } from '@smart-citizen/identity-contracts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@smart-citizen/shared-ui';
import { AdministrativeViewportGate } from './administrative-viewport-gate';
import { getPermittedNavigation, sliceOneNavigationKeys, type NavigationKey } from './navigation';

export interface ApplicationShellProps {
  enabledNavigation?: ReadonlySet<NavigationKey>;
  onSignOut: () => Promise<void>;
}

export function ApplicationShell({
  enabledNavigation = sliceOneNavigationKeys,
  onSignOut,
}: ApplicationShellProps) {
  const session = useOutletContext<SessionContext>();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const navigation = getPermittedNavigation(session, enabledNavigation);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await onSignOut();
    } finally {
      navigate('/sign-in', { replace: true });
    }
  };

  return (
    <AdministrativeViewportGate>
      <TooltipProvider>
        <div className="grid min-h-screen grid-cols-[5rem_minmax(0,1fr)] bg-background lg:grid-cols-[15.5rem_minmax(0,1fr)]">
          <a
            className="fixed top-3 left-3 z-50 -translate-y-20 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background transition-transform focus-visible:translate-y-0 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
            href="#main-content"
          >
            Skip to main content
          </a>
          <aside className="flex min-h-screen flex-col border-r bg-card px-3 py-4 lg:px-4">
            <div className="flex h-10 items-center justify-center gap-3 lg:justify-start lg:px-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
                SC
              </span>
              <span className="hidden text-sm font-semibold lg:block">Smart Citizen</span>
            </div>

            <nav aria-label="Primary navigation" className="mt-8 flex flex-1 flex-col gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const link = (
                  <NavLink
                    aria-label={item.label}
                    className={({ isActive }) =>
                      `flex h-10 items-center justify-center gap-3 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30 lg:justify-start ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`
                    }
                    end={item.path === '/'}
                    key={item.key}
                    to={item.path}
                  >
                    <Icon aria-hidden="true" className="size-4" />
                    <span className="hidden lg:block">{item.label}</span>
                  </NavLink>
                );

                return (
                  <Tooltip key={item.key}>
                    <TooltipTrigger render={link} />
                    <TooltipContent className="lg:hidden" side="right">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </nav>

            <p className="hidden px-2 text-xs leading-5 text-muted-foreground lg:block">
              Administrative workspace
            </p>
          </aside>

          <div className="min-w-0">
            <header className="flex h-16 items-center justify-between border-b bg-card px-6 lg:px-8">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{session.community.name}</p>
                <p className="text-xs text-muted-foreground">Community administration</p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Account menu"
                  className="grid size-10 place-items-center rounded-md border bg-background text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                  <UserRoundIcon aria-hidden="true" className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="px-2 py-2">
                      <span className="block text-xs font-normal text-muted-foreground">
                        Signed in as
                      </span>
                      <span className="mt-0.5 block truncate text-sm font-medium text-foreground">
                        {session.user.email}
                      </span>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem disabled={isSigningOut} onClick={() => void handleSignOut()}>
                      <LogOutIcon aria-hidden="true" />
                      {isSigningOut ? 'Signing out…' : 'Sign out'}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </header>

            <main
              className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-10 lg:py-10"
              id="main-content"
              tabIndex={-1}
            >
              <Outlet context={session} />
            </main>
          </div>
        </div>
      </TooltipProvider>
    </AdministrativeViewportGate>
  );
}
