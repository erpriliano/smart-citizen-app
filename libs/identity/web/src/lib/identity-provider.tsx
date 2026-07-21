import { createContext, useContext, type PropsWithChildren } from 'react';

import type { IdentityClient } from './identity-client';

const IdentityClientContext = createContext<IdentityClient | null>(null);

export interface IdentityProviderProps extends PropsWithChildren {
  client: IdentityClient;
}

export function IdentityProvider({ children, client }: IdentityProviderProps) {
  return <IdentityClientContext.Provider value={client}>{children}</IdentityClientContext.Provider>;
}

export function useIdentityClient(): IdentityClient {
  const client = useContext(IdentityClientContext);

  if (!client) {
    throw new Error('IdentityProvider is required.');
  }

  return client;
}
