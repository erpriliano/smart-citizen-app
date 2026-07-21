import type { SessionContext } from '@smart-citizen/identity-contracts';

export interface IdentityAccount {
  userId: string;
  email: string;
  passwordHash: string | null;
  membershipId: string;
  communityId: string;
}

export interface SessionContextLookup {
  userId: string;
  membershipId: string;
  communityId: string;
}

export abstract class IdentityAccountRepository {
  abstract findByNormalisedEmail(normalisedEmail: string): Promise<IdentityAccount | null>;

  abstract findSessionContext(lookup: SessionContextLookup): Promise<SessionContext | null>;
}
