import type { SessionContext } from '@smart-citizen/identity-contracts';

import {
  allNavigationKeys,
  getPermittedNavigation,
  type NavigationKey,
} from './navigation';

const baseSession: SessionContext = {
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
  positions: [],
  roles: [],
  permissions: [],
};

describe('getPermittedNavigation', () => {
  it('returns only enabled routes allowed by explicit permission codes', () => {
    const enabled = new Set<NavigationKey>([
      'overview',
      'houses',
      'residents',
      'financial-reports',
    ]);
    const session: SessionContext = {
      ...baseSession,
      permissions: ['residency.record.read'],
    };

    expect(getPermittedNavigation(session, enabled).map((item) => item.key)).toEqual([
      'overview',
      'houses',
      'residents',
    ]);
  });

  it('does not infer access from a Pak RT position', () => {
    const session: SessionContext = {
      ...baseSession,
      positions: [{ code: 'pak-rt', name: 'Pak RT' }],
    };

    expect(getPermittedNavigation(session, allNavigationKeys).map((item) => item.key)).toEqual([
      'overview',
    ]);
  });
});
