import { PrismaPg } from '@prisma/adapter-pg';
import { Inject, Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';

import { PrismaClient } from '../generated/prisma/client';

export const DATABASE_ADAPTER = Symbol('DATABASE_ADAPTER');

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject(DATABASE_ADAPTER) adapter: PrismaPg) {
    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
