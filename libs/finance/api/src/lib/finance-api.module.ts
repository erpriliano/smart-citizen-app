import { Module } from '@nestjs/common';
import { DatabaseModule } from '@smart-citizen/shared-database';

import { FinanceOverviewRepository } from './finance-overview.repository';
import { FinanceOverviewService } from './finance-overview.service';
import { PrismaFinanceOverviewRepository } from './prisma-finance-overview.repository';

@Module({
  imports: [DatabaseModule],
  providers: [
    FinanceOverviewService,
    { provide: FinanceOverviewRepository, useClass: PrismaFinanceOverviewRepository },
  ],
  exports: [FinanceOverviewService],
})
export class FinanceApiModule {}
