import { ForbiddenException, Injectable } from '@nestjs/common';
import type { SessionContext } from '@smart-citizen/identity-contracts';
import type { ResidencyOverview } from '@smart-citizen/residency-contracts';

import { ResidencyOverviewRepository } from './residency-overview.repository';

function communityLocalDate(now: Date, timezone: string): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    timeZone: timezone,
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return new Date(
    Date.UTC(Number(values['year']), Number(values['month']) - 1, Number(values['day'])),
  );
}

@Injectable()
export class ResidencyOverviewService {
  constructor(private readonly repository: ResidencyOverviewRepository) {}

  async getOverview(session: SessionContext, communityId: string): Promise<ResidencyOverview> {
    const permissions = new Set(session.permissions);
    const canReadRecords = permissions.has('residency.record.read');
    const canReadChanges = permissions.has('residency.change.read');

    if (communityId !== session.community.id || (!canReadRecords && !canReadChanges)) {
      throw new ForbiddenException('You do not have access to this resource.');
    }

    const recordsPromise = canReadRecords
      ? this.repository.getRecords(
          communityId,
          communityLocalDate(new Date(), session.community.timezone),
        )
      : Promise.resolve(null);
    const changesPromise = canReadChanges
      ? this.repository.getChanges(communityId)
      : Promise.resolve(null);
    const [records, changes] = await Promise.all([recordsPromise, changesPromise]);

    return { records, changes };
  }
}
