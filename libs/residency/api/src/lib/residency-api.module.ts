import { Module } from '@nestjs/common';
import { DatabaseModule } from '@smart-citizen/shared-database';

import { PrismaResidencyOverviewRepository } from './prisma-residency-overview.repository';
import { ResidencyOverviewRepository } from './residency-overview.repository';
import { ResidencyOverviewService } from './residency-overview.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    ResidencyOverviewService,
    { provide: ResidencyOverviewRepository, useClass: PrismaResidencyOverviewRepository },
  ],
  exports: [ResidencyOverviewService],
})
export class ResidencyApiModule {}
