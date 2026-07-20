import type { SessionContext, SignInInput } from '@smart-citizen/identity-contracts';
import { vi } from 'vitest';

import type { IdentityAccount, IdentityAccountRepository } from './identity-account.repository';
import {
  IdentitySessionService,
  InvalidCredentialsError,
  InvalidSessionError,
} from './identity-session.service';
import type { PasswordHasher } from './password-hasher';
import type { SessionTokenClaims, SessionTokenService } from './session-token.service';

const credentials: SignInInput = {
  email: 'admin@example.test',
  password: 'correct horse battery staple',
};

const account: IdentityAccount = {
  userId: 'dd7a82c6-1fcc-4d79-82dc-14ad743015b5',
  email: credentials.email,
  passwordHash: 'opaque-runtime-hash',
  membershipId: 'a2c8d45d-6cb8-4406-899c-0f54a64d40fd',
  communityId: '40db0b3f-0354-4f47-96df-bac69dc711a9',
};

const session: SessionContext = {
  user: { id: account.userId, email: account.email },
  membershipId: account.membershipId,
  community: {
    id: account.communityId,
    name: 'RT 05 Taman Warga',
    slug: 'rt-05-taman-warga',
    timezone: 'Asia/Jakarta',
    currency: 'IDR',
  },
  positions: [{ code: 'pak-rt', name: 'Pak RT' }],
  roles: [{ code: 'community-admin', name: 'Community Administrator' }],
  permissions: ['community.read', 'finance.approve'],
};

function createHarness(overrides?: {
  account?: IdentityAccount | null;
  passwordMatches?: boolean;
  session?: SessionContext | null;
  claims?: SessionTokenClaims | Error;
}) {
  const resolvedAccount = overrides && 'account' in overrides ? overrides.account : account;
  const resolvedSession = overrides && 'session' in overrides ? overrides.session : session;
  const repository = {
    findByNormalisedEmail: vi.fn().mockResolvedValue(resolvedAccount),
    findSessionContext: vi.fn().mockResolvedValue(resolvedSession),
  } satisfies IdentityAccountRepository;
  const passwordHasher = {
    verify: vi.fn().mockResolvedValue(overrides?.passwordMatches ?? true),
  } satisfies PasswordHasher;
  const defaultClaims: SessionTokenClaims = {
    sub: account.userId,
    membershipId: account.membershipId,
    communityId: account.communityId,
  };
  const sessionToken = {
    sign: vi.fn().mockResolvedValue('signed-session-token'),
    verify: vi.fn().mockImplementation(async () => {
      if (overrides?.claims instanceof Error) throw overrides.claims;
      return overrides?.claims ?? defaultClaims;
    }),
  } satisfies SessionTokenService;

  return {
    service: new IdentitySessionService(repository, passwordHasher, sessionToken),
    repository,
    passwordHasher,
    sessionToken,
  };
}

describe('IdentitySessionService', () => {
  it('signs in with normalised credentials and freshly resolved tenant context', async () => {
    const harness = createHarness();

    await expect(
      harness.service.signIn({
        email: '  ADMIN@EXAMPLE.TEST ',
        password: credentials.password,
      }),
    ).resolves.toEqual({ session, token: 'signed-session-token' });

    expect(harness.repository.findByNormalisedEmail).toHaveBeenCalledWith(credentials.email);
    expect(harness.passwordHasher.verify).toHaveBeenCalledWith(
      account.passwordHash,
      credentials.password,
    );
    expect(harness.repository.findSessionContext).toHaveBeenCalledWith({
      userId: account.userId,
      membershipId: account.membershipId,
      communityId: account.communityId,
    });
    expect(harness.sessionToken.sign).toHaveBeenCalledWith({
      sub: account.userId,
      membershipId: account.membershipId,
      communityId: account.communityId,
    });
  });

  it.each([
    ['unknown account', { account: null }],
    ['missing password hash', { account: { ...account, passwordHash: null } }],
    ['incorrect password', { passwordMatches: false }],
    ['inactive membership context', { session: null }],
  ] as const)('returns one credential failure for %s', async (_case, overrides) => {
    const harness = createHarness(overrides);

    await expect(harness.service.signIn(credentials)).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );

    expect(harness.passwordHasher.verify).toHaveBeenCalledOnce();
  });

  it('re-resolves active context for every session read', async () => {
    const harness = createHarness();

    await expect(harness.service.readSession('signed-session-token')).resolves.toEqual(session);
    expect(harness.repository.findSessionContext).toHaveBeenCalledWith({
      userId: account.userId,
      membershipId: account.membershipId,
      communityId: account.communityId,
    });
  });

  it('rejects invalid tokens without reaching persistence', async () => {
    const harness = createHarness({ claims: new Error('invalid signature') });

    await expect(harness.service.readSession('invalid-token')).rejects.toBeInstanceOf(
      InvalidSessionError,
    );
    expect(harness.repository.findSessionContext).not.toHaveBeenCalled();
  });

  it('rejects a cross-community claim when no compound tenant context exists', async () => {
    const otherCommunityId = '0d188c85-f608-4a6b-a90c-fd49454b5799';
    const harness = createHarness({
      claims: {
        sub: account.userId,
        membershipId: account.membershipId,
        communityId: otherCommunityId,
      },
      session: null,
    });

    await expect(harness.service.readSession('cross-community-token')).rejects.toBeInstanceOf(
      InvalidSessionError,
    );
    expect(harness.repository.findSessionContext).toHaveBeenCalledWith({
      userId: account.userId,
      membershipId: account.membershipId,
      communityId: otherCommunityId,
    });
  });
});
