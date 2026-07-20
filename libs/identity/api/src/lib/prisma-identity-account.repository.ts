import { Injectable } from '@nestjs/common';
import type { SessionContext } from '@smart-citizen/identity-contracts';
import { DatabaseService } from '@smart-citizen/shared-database';

import {
  IdentityAccountRepository,
  type IdentityAccount,
  type SessionContextLookup,
} from './identity-account.repository';

const ACTIVE_STATUS = 1;

@Injectable()
export class PrismaIdentityAccountRepository extends IdentityAccountRepository {
  constructor(private readonly database: DatabaseService) {
    super();
  }

  async findByNormalisedEmail(normalisedEmail: string): Promise<IdentityAccount | null> {
    const user = await this.database.user.findFirst({
      where: {
        normalizedEmail: normalisedEmail,
        status: ACTIVE_STATUS,
        membership: {
          status: ACTIVE_STATUS,
          community: { status: ACTIVE_STATUS },
        },
      },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        membership: {
          select: {
            id: true,
            communityId: true,
          },
        },
      },
    });

    if (!user?.membership) return null;

    return {
      userId: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      membershipId: user.membership.id,
      communityId: user.membership.communityId,
    };
  }

  async findSessionContext(lookup: SessionContextLookup): Promise<SessionContext | null> {
    const membership = await this.database.communityMembership.findFirst({
      where: {
        id: lookup.membershipId,
        userId: lookup.userId,
        communityId: lookup.communityId,
        status: ACTIVE_STATUS,
        user: { status: ACTIVE_STATUS },
        community: { status: ACTIVE_STATUS },
      },
      select: {
        id: true,
        user: {
          select: { id: true, email: true },
        },
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
            timezone: true,
            currency: true,
          },
        },
        positionAssignments: {
          where: {
            revokedDateTime: null,
            position: { status: ACTIVE_STATUS },
          },
          select: {
            position: { select: { code: true, name: true } },
          },
        },
        roleAssignments: {
          where: {
            revokedDateTime: null,
            role: { status: ACTIVE_STATUS },
          },
          select: {
            role: {
              select: {
                code: true,
                name: true,
                permissions: {
                  where: {
                    revokedDateTime: null,
                    permission: { status: ACTIVE_STATUS },
                  },
                  select: {
                    permission: { select: { code: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!membership) return null;

    const roles = membership.roleAssignments
      .map(({ role }) => ({ code: role.code, name: role.name }))
      .sort((left, right) => left.code.localeCompare(right.code));
    const positions = membership.positionAssignments
      .map(({ position }) => ({ code: position.code, name: position.name }))
      .sort((left, right) => left.code.localeCompare(right.code));
    const permissions = [
      ...new Set(
        membership.roleAssignments.flatMap(({ role }) =>
          role.permissions.map(({ permission }) => permission.code),
        ),
      ),
    ].sort();

    return {
      user: membership.user,
      membershipId: membership.id,
      community: membership.community,
      positions,
      roles,
      permissions,
    };
  }
}
