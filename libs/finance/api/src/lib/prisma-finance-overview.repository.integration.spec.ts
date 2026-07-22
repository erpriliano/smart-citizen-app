import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { DatabaseService } from '@smart-citizen/shared-database';

import { PrismaFinanceOverviewRepository } from './prisma-finance-overview.repository';

describe('PrismaFinanceOverviewRepository', () => {
  const suffix = randomUUID().replaceAll('-', '');
  const database = new DatabaseService(
    new PrismaPg({ connectionString: process.env['DATABASE_URL'] as string }),
  );
  const repository = new PrismaFinanceOverviewRepository(database);

  const userIds: string[] = [];
  let communityId: string;
  let otherCommunityId: string;
  let latestReportId: string;

  beforeAll(async () => {
    await database.$connect();
    const [user, otherUser] = await Promise.all([
      database.user.create({
        data: {
          email: `finance-overview-${suffix}@example.test`,
          normalizedEmail: `finance-overview-${suffix}@example.test`,
        },
      }),
      database.user.create({
        data: {
          email: `finance-overview-other-${suffix}@example.test`,
          normalizedEmail: `finance-overview-other-${suffix}@example.test`,
        },
      }),
    ]);
    userIds.push(user.id, otherUser.id);

    const [community, otherCommunity] = await Promise.all([
      database.community.create({
        data: { name: 'Finance Overview Test', slug: `finance-overview-${suffix}` },
      }),
      database.community.create({
        data: {
          name: 'Other Finance Overview Test',
          slug: `other-finance-overview-${suffix}`,
        },
      }),
    ]);
    communityId = community.id;
    otherCommunityId = otherCommunity.id;

    await Promise.all([
      database.communityMembership.create({ data: { communityId, userId: user.id } }),
      database.communityMembership.create({
        data: { communityId: otherCommunityId, userId: otherUser.id },
      }),
    ]);

    const [incomeCategory, expenseCategory] = await Promise.all([
      database.financialCategory.create({
        data: {
          communityId,
          code: `income-${suffix}`,
          name: 'Synthetic income',
          entryType: 'INCOME',
        },
      }),
      database.financialCategory.create({
        data: {
          communityId,
          code: `expense-${suffix}`,
          name: 'Synthetic expense',
          entryType: 'EXPENSE',
        },
      }),
    ]);

    await database.financialReport.create({
      data: {
        communityId,
        periodStart: new Date('2026-06-01'),
        periodEnd: new Date('2026-06-30'),
        revisionNumber: 1,
        openingBalanceMinor: 1_000_000n,
        workflowStage: 'DRAFT',
      },
    });
    const latestReport = await database.financialReport.create({
      data: {
        communityId,
        periodStart: new Date('2026-07-01'),
        periodEnd: new Date('2026-07-31'),
        revisionNumber: 2,
        openingBalanceMinor: 9_007_199_254_740_993n,
        workflowStage: 'UNDER_REVIEW',
      },
    });
    latestReportId = latestReport.id;

    await Promise.all([
      database.financialReportEntry.create({
        data: {
          communityId,
          reportId: latestReport.id,
          categoryId: incomeCategory.id,
          entryType: 'INCOME',
          transactionDate: new Date('2026-07-05'),
          description: 'Synthetic income entry',
          amountMinor: 3_000_000n,
        },
      }),
      database.financialReportEntry.create({
        data: {
          communityId,
          reportId: latestReport.id,
          categoryId: expenseCategory.id,
          entryType: 'EXPENSE',
          transactionDate: new Date('2026-07-07'),
          description: 'Synthetic expense entry',
          amountMinor: 1_250_000n,
        },
      }),
      database.financialReportEntry.create({
        data: {
          communityId,
          reportId: latestReport.id,
          categoryId: expenseCategory.id,
          entryType: 'EXPENSE',
          transactionDate: new Date('2026-07-08'),
          description: 'Inactive synthetic expense',
          amountMinor: 9_999_999n,
          status: 2,
        },
      }),
    ]);
  });

  afterAll(async () => {
    await database.financialReportEntry.deleteMany({ where: { communityId } });
    await database.financialReport.deleteMany({ where: { communityId } });
    await database.financialCategory.deleteMany({ where: { communityId } });
    await database.communityMembership.deleteMany({
      where: { communityId: { in: [communityId, otherCommunityId] } },
    });
    await database.community.deleteMany({
      where: { id: { in: [communityId, otherCommunityId] } },
    });
    await database.user.deleteMany({ where: { id: { in: userIds } } });
    await database.$disconnect();
  });

  it('selects the latest active report and calculates exact active-entry totals', async () => {
    await expect(repository.getLatestReport(communityId)).resolves.toEqual({
      id: latestReportId,
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
      revisionNumber: 2,
      workflowStage: 'UNDER_REVIEW',
      currency: 'IDR',
      openingBalanceMinor: '9007199254740993',
      incomeTotalMinor: '3000000',
      expenseTotalMinor: '1250000',
      closingBalanceMinor: '9007199256490993',
    });
    await expect(repository.countApprovalRequired(communityId)).resolves.toBe(1);
  });

  it('cannot return report data through another community key', async () => {
    await expect(repository.getLatestReport(otherCommunityId)).resolves.toBeNull();
    await expect(repository.countApprovalRequired(otherCommunityId)).resolves.toBe(0);
  });
});
