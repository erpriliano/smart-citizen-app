import { PrismaPg } from '@prisma/adapter-pg';
import { vi } from 'vitest';

import { DatabaseService } from './database.service';

describe('DatabaseService', () => {
  it('connects and disconnects with the Nest module lifecycle', async () => {
    const service = new DatabaseService(
      new PrismaPg({ connectionString: 'postgresql://localhost/smart_citizen_test' }),
    );
    const connect = vi.spyOn(service, '$connect').mockResolvedValue();
    const disconnect = vi.spyOn(service, '$disconnect').mockResolvedValue();

    await service.onModuleInit();
    await service.onModuleDestroy();

    expect(connect).toHaveBeenCalledOnce();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
