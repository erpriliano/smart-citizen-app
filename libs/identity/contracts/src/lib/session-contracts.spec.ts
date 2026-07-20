import { signInInputSchema, sessionContextSchema } from './session-contracts';

const session = {
  user: {
    id: 'dd7a82c6-1fcc-4d79-82dc-14ad743015b5',
    email: 'admin@example.test',
  },
  membershipId: 'a2c8d45d-6cb8-4406-899c-0f54a64d40fd',
  community: {
    id: '40db0b3f-0354-4f47-96df-bac69dc711a9',
    name: 'RT 05 Taman Warga',
    slug: 'rt-05-taman-warga',
    timezone: 'Asia/Jakarta',
    currency: 'IDR',
  },
  positions: [{ code: 'pak-rt', name: 'Pak RT' }],
  roles: [{ code: 'community-admin', name: 'Community Administrator' }],
  permissions: ['community.read', 'finance.approve'],
};

describe('identity session contracts', () => {
  it('normalises sign-in email input without altering the password', () => {
    expect(
      signInInputSchema.parse({
        email: '  ADMIN@Example.Test ',
        password: 'correct horse battery staple',
      }),
    ).toEqual({
      email: 'admin@example.test',
      password: 'correct horse battery staple',
    });
  });

  it('rejects short passwords and unexpected privileged fields', () => {
    expect(() =>
      signInInputSchema.parse({
        email: 'admin@example.test',
        password: 'short',
        communityId: session.community.id,
        role: 'platform-owner',
      }),
    ).toThrow();
  });

  it('parses the complete safe session context', () => {
    expect(sessionContextSchema.parse(session)).toEqual(session);
  });

  it('rejects malformed tenant identifiers and unsafe credential fields', () => {
    expect(() =>
      sessionContextSchema.parse({
        ...session,
        community: { ...session.community, id: 'not-a-uuid' },
        passwordHash: 'must-not-cross-the-contract',
      }),
    ).toThrow();
  });
});
