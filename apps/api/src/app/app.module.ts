import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FinanceApiModule } from '@smart-citizen/finance-api';
import { IdentityApiModule } from '@smart-citizen/identity-api';
import { ResidencyApiModule } from '@smart-citizen/residency-api';
import { parseEnvironment } from '@smart-citizen/shared-configuration';
import { FinanceOverviewController } from './finance/finance-overview.controller';
import { HealthModule } from './health/health.module';
import { ResidencyOverviewController } from './residency/residency-overview.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      validate: parseEnvironment,
    }),
    IdentityApiModule,
    ResidencyApiModule,
    FinanceApiModule,
    HealthModule,
  ],
  controllers: [ResidencyOverviewController, FinanceOverviewController],
})
export class AppModule {}
