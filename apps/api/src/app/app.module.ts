import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IdentityApiModule } from '@smart-citizen/identity-api';
import { parseEnvironment } from '@smart-citizen/shared-configuration';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      validate: parseEnvironment,
    }),
    IdentityApiModule,
    HealthModule,
  ],
})
export class AppModule {}
