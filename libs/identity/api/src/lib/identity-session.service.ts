import { Injectable } from '@nestjs/common';
import {
  signInInputSchema,
  type SessionContext,
  type SignInInput,
} from '@smart-citizen/identity-contracts';

import { IdentityAccountRepository } from './identity-account.repository';
import { PasswordHasher } from './password-hasher';
import { SessionTokenService } from './session-token.service';

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials');
    this.name = 'InvalidCredentialsError';
  }
}

export class InvalidSessionError extends Error {
  constructor() {
    super('Invalid session');
    this.name = 'InvalidSessionError';
  }
}

export interface SignedInSession {
  session: SessionContext;
  token: string;
}

@Injectable()
export class IdentitySessionService {
  constructor(
    private readonly accounts: IdentityAccountRepository,
    private readonly passwords: PasswordHasher,
    private readonly tokens: SessionTokenService,
  ) {}

  async signIn(input: SignInInput): Promise<SignedInSession> {
    const credentials = signInInputSchema.parse(input);
    const account = await this.accounts.findByNormalisedEmail(credentials.email);
    const passwordMatches = await this.passwords.verify(
      account?.passwordHash ?? null,
      credentials.password,
    );

    if (!account || !account.passwordHash || !passwordMatches) {
      throw new InvalidCredentialsError();
    }

    const lookup = {
      userId: account.userId,
      membershipId: account.membershipId,
      communityId: account.communityId,
    };
    const session = await this.accounts.findSessionContext(lookup);

    if (!session) {
      throw new InvalidCredentialsError();
    }

    return {
      session,
      token: await this.tokens.sign({
        sub: lookup.userId,
        membershipId: lookup.membershipId,
        communityId: lookup.communityId,
      }),
    };
  }

  async readSession(token: string): Promise<SessionContext> {
    let claims;

    try {
      claims = await this.tokens.verify(token);
    } catch {
      throw new InvalidSessionError();
    }

    const session = await this.accounts.findSessionContext({
      userId: claims.sub,
      membershipId: claims.membershipId,
      communityId: claims.communityId,
    });

    if (!session) {
      throw new InvalidSessionError();
    }

    return session;
  }
}
