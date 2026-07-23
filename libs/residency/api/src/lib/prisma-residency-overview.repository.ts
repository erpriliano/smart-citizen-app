import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@smart-citizen/shared-database';

import {
  ResidencyOverviewRepository,
  type ResidencyChangeSummary,
  type ResidencyRecordSummary,
} from './residency-overview.repository';

const ACTIVE_STATUS = 1;

@Injectable()
export class PrismaResidencyOverviewRepository extends ResidencyOverviewRepository {
  constructor(private readonly database: DatabaseService) {
    super();
  }

  async getRecords(communityId: string, localDate: Date): Promise<ResidencyRecordSummary> {
    const currentResidencyWhere = {
      communityId,
      status: ACTIVE_STATUS,
      startDate: { lte: localDate },
      OR: [{ endDate: null }, { endDate: { gte: localDate } }],
      house: { status: ACTIVE_STATUS },
      resident: { status: ACTIVE_STATUS },
    };

    const [activeHouseCount, occupiedHouses, currentResidents] = await Promise.all([
      this.database.house.count({ where: { communityId, status: ACTIVE_STATUS } }),
      this.database.residency.findMany({
        where: currentResidencyWhere,
        select: { houseId: true },
        distinct: ['houseId'],
      }),
      this.database.residency.findMany({
        where: currentResidencyWhere,
        select: { residentId: true },
        distinct: ['residentId'],
      }),
    ]);

    return {
      activeHouseCount,
      occupiedHouseCount: occupiedHouses.length,
      currentResidentCount: currentResidents.length,
    };
  }

  async getChanges(communityId: string): Promise<ResidencyChangeSummary> {
    const [pendingCount, recent] = await Promise.all([
      this.database.residencyChangeSubmission.count({
        where: {
          communityId,
          workflowStage: 'SUBMITTED',
          status: ACTIVE_STATUS,
        },
      }),
      this.database.residencyChangeSubmission.findMany({
        where: { communityId, status: ACTIVE_STATUS },
        select: {
          id: true,
          changeType: true,
          workflowStage: true,
          createdDateTime: true,
          updatedDateTime: true,
        },
        orderBy: [{ updatedDateTime: 'desc' }, { id: 'asc' }],
        take: 5,
      }),
    ]);

    return {
      pendingCount,
      recent: recent.map((submission) => ({
        id: submission.id,
        changeType: submission.changeType,
        workflowStage: submission.workflowStage,
        submittedDateTime: submission.createdDateTime.toISOString(),
        updatedDateTime: submission.updatedDateTime.toISOString(),
      })),
    };
  }
}
