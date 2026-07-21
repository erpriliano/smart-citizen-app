import { CalendarDaysIcon, ClipboardListIcon } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import type { SessionContext } from '@smart-citizen/identity-contracts';

interface CivilDate {
  year: number;
  month: number;
  day: number;
}

function getCivilDate(date: Date, timezone: string): CivilDate {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    timeZone: timezone,
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

export function formatWeekRange(referenceDate: Date, timezone: string): string {
  const civilDate = getCivilDate(referenceDate, timezone);
  const currentDay = new Date(Date.UTC(civilDate.year, civilDate.month - 1, civilDate.day));
  const daysSinceMonday = (currentDay.getUTCDay() + 6) % 7;
  const start = new Date(currentDay);
  start.setUTCDate(start.getUTCDate() - daysSinceMonday);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).formatRange(start, end);
}

export interface WeeklyOverviewPageProps {
  now?: Date;
}

export function WeeklyOverviewPage({ now = new Date() }: WeeklyOverviewPageProps) {
  const session = useOutletContext<SessionContext>();
  const officerPositions = session.positions.map((position) => position.name);

  return (
    <div className="space-y-10">
      <header className="flex items-start justify-between gap-8">
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
            <CalendarDaysIcon aria-hidden="true" className="size-4" />
            {formatWeekRange(now, session.community.timezone)}
          </p>
          <h1 className="text-2xl font-semibold text-foreground">Weekly overview</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Review the current administrative position before taking action.
          </p>
        </div>
      </header>

      <section aria-labelledby="community-context-heading">
        <h2 id="community-context-heading" className="text-sm font-semibold text-foreground">
          Community context
        </h2>
        <dl className="mt-3 grid grid-cols-2 border-y bg-card md:grid-cols-3">
          <div className="border-r px-4 py-4">
            <dt className="text-xs text-muted-foreground">Community</dt>
            <dd className="mt-1 text-sm font-medium">{session.community.name}</dd>
          </div>
          <div className="border-r px-4 py-4">
            <dt className="text-xs text-muted-foreground">Position</dt>
            <dd className="mt-1 text-sm font-medium">
              {officerPositions.length > 0 ? officerPositions.join(', ') : 'Administrative officer'}
            </dd>
          </div>
          <div className="col-span-2 border-t px-4 py-4 md:col-span-1 md:border-t-0">
            <dt className="text-xs text-muted-foreground">Timezone</dt>
            <dd className="mt-1 text-sm font-medium">{session.community.timezone}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="operational-summary-heading" className="border-t pt-8">
        <div className="flex gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
            <ClipboardListIcon aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h2 id="operational-summary-heading" className="text-sm font-semibold">
              Operational summary
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
              Operational summaries will appear here as residency and finance are connected.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
