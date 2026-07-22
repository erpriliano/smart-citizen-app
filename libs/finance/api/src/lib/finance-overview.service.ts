import { ForbiddenException, Injectable } from '@nestjs/common';
import type { FinanceOverview } from '@smart-citizen/finance-contracts';
import type { SessionContext } from '@smart-citizen/identity-contracts';

import { FinanceOverviewRepository } from './finance-overview.repository';

@Injectable()
export class FinanceOverviewService {
  constructor(private readonly repository: FinanceOverviewRepository) {}

  async getOverview(session: SessionContext, communityId: string): Promise<FinanceOverview> {
    const permissions = new Set(session.permissions);
    if (communityId !== session.community.id || !permissions.has('finance.report.read')) {
      throw new ForbiddenException('You do not have access to this resource.');
    }

    const latestReportPromise = this.repository.getLatestReport(communityId);
    const approvalRequiredCountPromise = permissions.has('finance.report.approve')
      ? this.repository.countApprovalRequired(communityId)
      : Promise.resolve(null);
    const [latestReport, approvalRequiredCount] = await Promise.all([
      latestReportPromise,
      approvalRequiredCountPromise,
    ]);

    return { latestReport, approvalRequiredCount };
  }
}
