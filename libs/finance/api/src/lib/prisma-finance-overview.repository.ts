import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@smart-citizen/shared-database';

import { FinanceOverviewRepository, type LatestFinanceReport } from './finance-overview.repository';

const ACTIVE_STATUS = 1;

function toCivilDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

@Injectable()
export class PrismaFinanceOverviewRepository extends FinanceOverviewRepository {
  constructor(private readonly database: DatabaseService) {
    super();
  }

  async getLatestReport(communityId: string): Promise<LatestFinanceReport | null> {
    const report = await this.database.financialReport.findFirst({
      where: { communityId, status: ACTIVE_STATUS },
      select: {
        id: true,
        periodStart: true,
        periodEnd: true,
        revisionNumber: true,
        workflowStage: true,
        currency: true,
        openingBalanceMinor: true,
        entries: {
          where: { status: ACTIVE_STATUS },
          select: { entryType: true, amountMinor: true },
        },
      },
      orderBy: [
        { periodEnd: 'desc' },
        { periodStart: 'desc' },
        { revisionNumber: 'desc' },
        { createdDateTime: 'desc' },
      ],
    });

    if (!report) return null;

    let incomeTotalMinor = 0n;
    let expenseTotalMinor = 0n;
    for (const entry of report.entries) {
      if (entry.entryType === 'INCOME') incomeTotalMinor += entry.amountMinor;
      else expenseTotalMinor += entry.amountMinor;
    }

    return {
      id: report.id,
      periodStart: toCivilDate(report.periodStart),
      periodEnd: toCivilDate(report.periodEnd),
      revisionNumber: report.revisionNumber,
      workflowStage: report.workflowStage,
      currency: report.currency,
      openingBalanceMinor: report.openingBalanceMinor.toString(),
      incomeTotalMinor: incomeTotalMinor.toString(),
      expenseTotalMinor: expenseTotalMinor.toString(),
      closingBalanceMinor: (
        report.openingBalanceMinor +
        incomeTotalMinor -
        expenseTotalMinor
      ).toString(),
    };
  }

  countApprovalRequired(communityId: string): Promise<number> {
    return this.database.financialReport.count({
      where: {
        communityId,
        workflowStage: 'UNDER_REVIEW',
        status: ACTIVE_STATUS,
      },
    });
  }
}
