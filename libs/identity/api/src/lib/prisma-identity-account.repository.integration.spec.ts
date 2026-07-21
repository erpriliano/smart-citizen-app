import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { DatabaseService } from '@smart-citizen/shared-database';

import { PrismaIdentityAccountRepository } from './prisma-identity-account.repository';

describe('PrismaIdentityAccountRepository', () => {
  const suffix = randomUUID().replaceAll('-', '');
  const email = `identity-${suffix}@example.test`;
  const permissionCode = `community.read-${suffix}`;
  const revokedPermissionCode = `finance.approve-${suffix}`;
  const database = new DatabaseService(
    new PrismaPg({ connectionString: process.env['DATABASE_URL'] as string }),
  );
  const repository = new PrismaIdentityAccountRepository(database);

  let userId: string;
  let communityId: string;
  let otherCommunityId: string;
  let membershipId: string;
  let positionId: string;
  let roleId: string;
  let permissionId: string;
  let revokedPermissionId: string;

  beforeAll(async () => {
    await database.$connect();

    const user = await database.user.create({
      data: {
        email,
        normalizedEmail: email,
      },
    });
    userId = user.id;

    const community = await database.community.create({
      data: {
        name: 'Repository Test Community',
        slug: `repository-test-${suffix}`,
      },
    });
    communityId = community.id;

    const otherCommunity = await database.community.create({
      data: {
        name: 'Other Repository Test Community',
        slug: `other-repository-test-${suffix}`,
      },
    });
    otherCommunityId = otherCommunity.id;

    const membership = await database.communityMembership.create({
      data: { communityId, userId },
    });
    membershipId = membership.id;

    const position = await database.communityPosition.create({
      data: {
        communityId,
        code: `pak-rt-${suffix}`,
        name: 'Pak RT',
      },
    });
    positionId = position.id;

    const role = await database.communityRole.create({
      data: {
        communityId,
        code: `community-admin-${suffix}`,
        name: 'Community Administrator',
      },
    });
    roleId = role.id;

    const permission = await database.permission.create({
      data: {
        code: permissionCode,
        name: 'Read community',
      },
    });
    permissionId = permission.id;

    const revokedPermission = await database.permission.create({
      data: {
        code: revokedPermissionCode,
        name: 'Approve finance',
      },
    });
    revokedPermissionId = revokedPermission.id;

    await database.membershipPositionAssignment.create({
      data: { communityId, membershipId, positionId },
    });
    await database.membershipRole.create({
      data: { communityId, membershipId, roleId },
    });
    await database.rolePermission.create({
      data: { communityId, roleId, permissionId },
    });
    await database.rolePermission.create({
      data: {
        communityId,
        roleId,
        permissionId: revokedPermissionId,
        createdDateTime: new Date('2026-01-01T00:00:00.000Z'),
        revokedDateTime: new Date(),
      },
    });
  });

  afterAll(async () => {
    await database.rolePermission.deleteMany({ where: { communityId } });
    await database.membershipRole.deleteMany({ where: { communityId } });
    await database.membershipPositionAssignment.deleteMany({ where: { communityId } });
    await database.communityRole.deleteMany({ where: { communityId } });
    await database.communityPosition.deleteMany({ where: { communityId } });
    await database.communityMembership.deleteMany({ where: { communityId } });
    await database.permission.deleteMany({
      where: { id: { in: [permissionId, revokedPermissionId] } },
    });
    await database.community.deleteMany({
      where: { id: { in: [communityId, otherCommunityId] } },
    });
    await database.user.deleteMany({ where: { id: userId } });
    await database.$disconnect();
  });

  it('loads one active account by normalised email', async () => {
    await expect(repository.findByNormalisedEmail(email)).resolves.toEqual({
      userId,
      email,
      passwordHash: null,
      membershipId,
      communityId,
    });
  });

  it('loads only active assignments from the compound tenant context', async () => {
    await expect(
      repository.findSessionContext({ userId, membershipId, communityId }),
    ).resolves.toEqual({
      user: { id: userId, email },
      membershipId,
      community: {
        id: communityId,
        name: 'Repository Test Community',
        slug: `repository-test-${suffix}`,
        timezone: 'Asia/Jakarta',
        currency: 'IDR',
      },
      positions: [{ code: `pak-rt-${suffix}`, name: 'Pak RT' }],
      roles: [
        {
          code: `community-admin-${suffix}`,
          name: 'Community Administrator',
        },
      ],
      permissions: [permissionCode],
    });
  });

  it('does not resolve the same membership through another community', async () => {
    await expect(
      repository.findSessionContext({
        userId,
        membershipId,
        communityId: otherCommunityId,
      }),
    ).resolves.toBeNull();
  });
});
