import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import type { Environment } from '@smart-citizen/shared-configuration';

import { DATABASE_ADAPTER, DatabaseService } from './database.service';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_ADAPTER,
      inject: [ConfigService],
      useFactory: (configuration: ConfigService<Environment, true>) =>
        new PrismaPg({
          connectionString: configuration.get('DATABASE_URL', { infer: true }),
        }),
    },
    DatabaseService,
  ],
  exports: [DatabaseService],
})
export class DatabaseModule {}
