import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { DatabaseService } from '@smart-citizen/shared-database';

import { PrismaResidencyOverviewRepository } from './prisma-residency-overview.repository';

describe('PrismaResidencyOverviewRepository', () => {
  const suffix = randomUUID().replaceAll('-', '');
  const database = new DatabaseService(
    new PrismaPg({ connectionString: process.env['DATABASE_URL'] as string }),
  );
  const repository = new PrismaResidencyOverviewRepository(database);

  let communityId: string;
  let otherCommunityId: string;
  let membershipId: string;
  const userIds: string[] = [];

  beforeAll(async () => {
    await database.$connect();

    const [user, otherUser] = await Promise.all([
      database.user.create({
        data: {
          email: `residency-overview-${suffix}@example.test`,
          normalizedEmail: `residency-overview-${suffix}@example.test`,
        },
      }),
      database.user.create({
        data: {
          email: `residency-overview-other-${suffix}@example.test`,
          normalizedEmail: `residency-overview-other-${suffix}@example.test`,
        },
      }),
    ]);
    userIds.push(user.id, otherUser.id);

    const [community, otherCommunity] = await Promise.all([
      database.community.create({
        data: { name: 'Residency Overview Test', slug: `residency-overview-${suffix}` },
      }),
      database.community.create({
        data: {
          name: 'Other Residency Overview Test',
          slug: `other-residency-overview-${suffix}`,
        },
      }),
    ]);
    communityId = community.id;
    otherCommunityId = otherCommunity.id;

    const [membership] = await Promise.all([
      database.communityMembership.create({ data: { communityId, userId: user.id } }),
      database.communityMembership.create({
        data: { communityId: otherCommunityId, userId: otherUser.id },
      }),
    ]);
    membershipId = membership.id;

    const houses = await Promise.all(
      [
        ['A-01', 1],
        ['A-02', 1],
        ['A-03', 1],
        ['A-04', 2],
      ].map(([code, status]) =>
        database.house.create({
          data: {
            communityId,
            code: `${code}-${suffix}`,
            addressLine: `Synthetic ${code}`,
            status: Number(status),
          },
        }),
      ),
    );

    const residents = await Promise.all(
      Array.from({ length: 6 }, (_, index) =>
        database.resident.create({
          data: { communityId, fullName: `Synthetic Resident ${index + 1}` },
        }),
      ),
    );

    const [houseOne, houseTwo, houseThree] = houses;
    const [residentOne, residentTwo, residentThree, residentFour, residentFive, residentSix] =
      residents;
    if (
      !houseOne ||
      !houseTwo ||
      !houseThree ||
      !residentOne ||
      !residentTwo ||
      !residentThree ||
      !residentFour ||
      !residentFive ||
      !residentSix
    ) {
      throw new Error('Synthetic residency fixtures were not created.');
    }

    await Promise.all([
      database.residency.create({
        data: {
          communityId,
          residentId: residentOne.id,
          houseId: houseOne.id,
          residencyType: 'PERMANENT',
          startDate: new Date('2026-01-01'),
        },
      }),
      database.residency.create({
        data: {
          communityId,
          residentId: residentTwo.id,
          houseId: houseOne.id,
          residencyType: 'TEMPORARY',
          startDate: new Date('2026-02-01'),
        },
      }),
      database.residency.create({
        data: {
          communityId,
          residentId: residentThree.id,
          houseId: houseTwo.id,
          residencyType: 'PERMANENT',
          startDate: new Date('2026-03-01'),
        },
      }),
      database.residency.create({
        data: {
          communityId,
          residentId: residentFour.id,
          houseId: houseThree.id,
          residencyType: 'PERMANENT',
          startDate: new Date('2026-08-01'),
        },
      }),
      database.residency.create({
        data: {
          communityId,
          residentId: residentFive.id,
          houseId: houseThree.id,
          residencyType: 'PERMANENT',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2026-06-30'),
        },
      }),
      database.residency.create({
        data: {
          communityId,
          residentId: residentSix.id,
          houseId: houseThree.id,
          residencyType: 'PERMANENT',
          startDate: new Date('2026-01-01'),
          status: 2,
        },
      }),
    ]);

    await Promise.all([
      database.residencyChangeSubmission.create({
        data: {
          communityId,
          changeType: 'MOVE_IN',
          workflowStage: 'SUBMITTED',
          houseId: houseThree.id,
          submittedByMembershipId: membershipId,
          createdByMembershipId: membershipId,
          updatedByMembershipId: membershipId,
          createdDateTime: new Date('2026-07-20T08:00:00.000Z'),
          updatedDateTime: new Date('2026-07-20T08:00:00.000Z'),
        },
      }),
      database.residencyChangeSubmission.create({
        data: {
          communityId,
          changeType: 'MOVE_OUT',
          workflowStage: 'SUBMITTED',
          residentId: residentOne.id,
          submittedByMembershipId: membershipId,
          createdByMembershipId: membershipId,
          updatedByMembershipId: membershipId,
          createdDateTime: new Date('2026-07-21T08:00:00.000Z'),
          updatedDateTime: new Date('2026-07-21T08:00:00.000Z'),
        },
      }),
      database.residencyChangeSubmission.create({
        data: {
          communityId,
          changeType: 'CORRECTION',
          workflowStage: 'APPLIED',
          residentId: residentTwo.id,
          submittedByMembershipId: membershipId,
          createdByMembershipId: membershipId,
          updatedByMembershipId: membershipId,
          createdDateTime: new Date('2026-07-19T08:00:00.000Z'),
          updatedDateTime: new Date('2026-07-22T08:00:00.000Z'),
        },
      }),
    ]);
  });

  afterAll(async () => {
    await database.residencyChangeSubmission.deleteMany({ where: { communityId } });
    await database.residency.deleteMany({ where: { communityId } });
    await database.resident.deleteMany({ where: { communityId } });
    await database.house.deleteMany({ where: { communityId } });
    await database.communityMembership.deleteMany({
      where: { communityId: { in: [communityId, otherCommunityId] } },
    });
    await database.community.deleteMany({
      where: { id: { in: [communityId, otherCommunityId] } },
    });
    await database.user.deleteMany({ where: { id: { in: userIds } } });
    await database.$disconnect();
  });

  it('counts active current records within one community and civil date', async () => {
    await expect(repository.getRecords(communityId, new Date('2026-07-22'))).resolves.toEqual({
      activeHouseCount: 3,
      occupiedHouseCount: 2,
      currentResidentCount: 3,
    });
  });

  it('returns only privacy-safe active change activity in stable recent order', async () => {
    const result = await repository.getChanges(communityId);

    expect(result.pendingCount).toBe(2);
    expect(result.recent).toHaveLength(3);
    expect(result.recent.map(({ changeType }) => changeType)).toEqual([
      'CORRECTION',
      'MOVE_OUT',
      'MOVE_IN',
    ]);
    expect(result.recent[0]).toEqual({
      id: expect.any(String),
      changeType: 'CORRECTION',
      workflowStage: 'APPLIED',
      submittedDateTime: '2026-07-19T08:00:00.000Z',
      updatedDateTime: '2026-07-22T08:00:00.000Z',
    });
    expect(JSON.stringify(result)).not.toContain('Synthetic Resident');
  });

  it('does not return another community through a supplied tenant key', async () => {
    await expect(repository.getRecords(otherCommunityId, new Date('2026-07-22'))).resolves.toEqual({
      activeHouseCount: 0,
      occupiedHouseCount: 0,
      currentResidentCount: 0,
    });
    await expect(repository.getChanges(otherCommunityId)).resolves.toEqual({
      pendingCount: 0,
      recent: [],
    });
  });
});
