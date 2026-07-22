import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IdentityApiModule } from '@smart-citizen/identity-api';
import { ResidencyApiModule } from '@smart-citizen/residency-api';
import { parseEnvironment } from '@smart-citizen/shared-configuration';
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
    HealthModule,
  ],
  controllers: [ResidencyOverviewController],
})
export class AppModule {}
