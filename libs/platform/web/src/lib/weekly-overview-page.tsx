import type { FinanceOverview } from '@smart-citizen/finance-contracts';
import type { SessionContext } from '@smart-citizen/identity-contracts';
import type { ResidencyOverview } from '@smart-citizen/residency-contracts';
import { Alert, AlertDescription, AlertTitle, Button, Skeleton } from '@smart-citizen/shared-ui';
import {
  CalendarDaysIcon,
  CircleAlertIcon,
  ClipboardCheckIcon,
  HomeIcon,
  LandmarkIcon,
  RefreshCwIcon,
} from 'lucide-react';

interface CivilDate {
  year: number;
  month: number;
  day: number;
}

export type OverviewSectionState<T> =
  | { status: 'loading' }
  | { status: 'error'; retry: () => void }
  | { status: 'ready'; data: T };

function getCivilDate(date: Date, timezone: string): CivilDate {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    timeZone: timezone,
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(values['year']),
    month: Number(values['month']),
    day: Number(values['day']),
  };
}

function parseCivilDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
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

function formatPeriod(start: string, end: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).formatRange(parseCivilDate(start), parseCivilDate(end));
}

function formatActivityDate(value: string, timezone: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: timezone,
  }).format(new Date(value));
}

function formatIdrMinorUnits(value: string): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    currencyDisplay: 'symbol',
    maximumFractionDigits: 0,
  })
    .format(BigInt(value))
    .replaceAll(/\s/g, '');
}

const changeTypeLabels = {
  MOVE_IN: 'Move-in',
  MOVE_OUT: 'Move-out',
  CORRECTION: 'Correction',
} as const;

const residencyStageLabels = {
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  APPLIED: 'Applied',
} as const;

const financeStageLabels = {
  DRAFT: 'Draft',
  UNDER_REVIEW: 'Under review',
  APPROVED: 'Approved',
} as const;

function DomainLoadingState({ label }: { label: string }) {
  return (
    <section aria-busy="true" aria-label={label} className="border-t pt-7">
      <div className="flex items-center gap-3">
        <Skeleton className="size-9" />
        <Skeleton className="h-5 w-36" />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-md border bg-border">
        <Skeleton className="h-24 rounded-none bg-card" />
        <Skeleton className="h-24 rounded-none bg-card" />
        <Skeleton className="h-24 rounded-none bg-card" />
      </div>
    </section>
  );
}

interface DomainErrorStateProps {
  label: string;
  retry: () => void;
  retryLabel: string;
}

function DomainErrorState({ label, retry, retryLabel }: DomainErrorStateProps) {
  return (
    <section aria-label={label} className="border-t pt-7">
      <Alert>
        <CircleAlertIcon aria-hidden="true" />
        <AlertTitle>Summary unavailable</AlertTitle>
        <AlertDescription>
          This summary could not be loaded. Other available information remains current.
        </AlertDescription>
        <Button className="mt-3 w-fit" onClick={retry} size="sm" variant="outline">
          {retryLabel}
        </Button>
      </Alert>
    </section>
  );
}

function CommunityRecords({ records }: { records: NonNullable<ResidencyOverview['records']> }) {
  const isEmpty =
    records.activeHouseCount === 0 &&
    records.occupiedHouseCount === 0 &&
    records.currentResidentCount === 0;

  return (
    <section aria-label="Community records" className="border-t pt-7">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
          <HomeIcon aria-hidden="true" className="size-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Community records</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Current active residency position</p>
        </div>
      </div>

      {isEmpty ? (
        <p className="mt-5 border-y bg-card px-4 py-5 text-sm text-muted-foreground">
          No active house or resident records yet.
        </p>
      ) : (
        <dl className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-md border bg-border">
          <div className="min-w-0 bg-card px-4 py-5">
            <dt className="text-xs text-muted-foreground">Active houses</dt>
            <dd className="mt-2 text-2xl font-semibold tabular-nums">{records.activeHouseCount}</dd>
          </div>
          <div className="min-w-0 bg-card px-4 py-5">
            <dt className="text-xs text-muted-foreground">Occupancy</dt>
            <dd className="mt-2 text-base font-semibold tabular-nums">
              {records.occupiedHouseCount} occupied
            </dd>
          </div>
          <div className="min-w-0 bg-card px-4 py-5">
            <dt className="text-xs text-muted-foreground">Residents</dt>
            <dd className="mt-2 text-base font-semibold tabular-nums">
              {records.currentResidentCount} current residents
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}

interface ResidencyReviewProps {
  changes: NonNullable<ResidencyOverview['changes']>;
  timezone: string;
}

function ResidencyReview({ changes, timezone }: ResidencyReviewProps) {
  return (
    <section aria-label="Residency review" className="border-t pt-7">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
            <ClipboardCheckIcon aria-hidden="true" className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Residency review</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Recent submission activity</p>
          </div>
        </div>
        <p className="shrink-0 text-sm font-semibold tabular-nums">
          {changes.pendingCount} pending
        </p>
      </div>

      {changes.recent.length === 0 ? (
        <p className="mt-5 border-y bg-card px-4 py-5 text-sm text-muted-foreground">
          No residency changes have been submitted.
        </p>
      ) : (
        <ul className="mt-5 divide-y border-y bg-card">
          {changes.recent.map((activity) => (
            <li
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3"
              key={activity.id}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{changeTypeLabels[activity.changeType]}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Updated {formatActivityDate(activity.updatedDateTime, timezone)}
                </p>
              </div>
              <span className="rounded-sm border px-2 py-1 text-xs font-medium text-muted-foreground">
                {residencyStageLabels[activity.workflowStage]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ResidencySections({
  session,
  state,
}: {
  session: SessionContext;
  state: OverviewSectionState<ResidencyOverview>;
}) {
  if (state.status === 'loading') return <DomainLoadingState label="Residency review" />;
  if (state.status === 'error') {
    return (
      <DomainErrorState
        label="Residency review"
        retry={state.retry}
        retryLabel="Retry residency overview"
      />
    );
  }

  return (
    <>
      {state.data.records ? <CommunityRecords records={state.data.records} /> : null}
      {state.data.changes ? (
        <ResidencyReview changes={state.data.changes} timezone={session.community.timezone} />
      ) : null}
    </>
  );
}

function FinanceReview({ finance }: { finance: FinanceOverview }) {
  const report = finance.latestReport;

  return (
    <section aria-label="Finance review" className="border-t pt-7">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
            <LandmarkIcon aria-hidden="true" className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Finance review</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {report
                ? formatPeriod(report.periodStart, report.periodEnd)
                : 'Latest report position'}
            </p>
          </div>
        </div>
        {report ? (
          <span className="shrink-0 rounded-sm border px-2 py-1 text-xs font-medium text-muted-foreground">
            {financeStageLabels[report.workflowStage]}
          </span>
        ) : null}
      </div>

      {report ? (
        <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-md border bg-border lg:grid-cols-4">
          {[
            ['Opening balance', report.openingBalanceMinor],
            ['Income', report.incomeTotalMinor],
            ['Expenses', report.expenseTotalMinor],
            ['Closing balance', report.closingBalanceMinor],
          ].map(([label, value]) => (
            <div className="min-w-0 bg-card px-4 py-5" key={label}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-2 break-words text-sm font-semibold tabular-nums">
                {formatIdrMinorUnits(value ?? '0')}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-5 border-y bg-card px-4 py-5 text-sm text-muted-foreground">
          No financial reports have been created.
        </p>
      )}

      {finance.approvalRequiredCount && finance.approvalRequiredCount > 0 ? (
        <p className="mt-3 text-sm font-medium text-primary">
          {finance.approvalRequiredCount}{' '}
          {finance.approvalRequiredCount === 1 ? 'report' : 'reports'} awaiting approval
        </p>
      ) : null}
    </section>
  );
}

function FinanceSection({ state }: { state: OverviewSectionState<FinanceOverview> }) {
  if (state.status === 'loading') return <DomainLoadingState label="Finance review" />;
  if (state.status === 'error') {
    return (
      <DomainErrorState
        label="Finance review"
        retry={state.retry}
        retryLabel="Retry finance overview"
      />
    );
  }

  return <FinanceReview finance={state.data} />;
}

export interface WeeklyOverviewPageProps {
  finance: OverviewSectionState<FinanceOverview> | null;
  isRefreshing: boolean;
  now?: Date;
  onRefresh: () => void;
  residency: OverviewSectionState<ResidencyOverview> | null;
  session: SessionContext;
}

export function WeeklyOverviewPage({
  finance,
  isRefreshing,
  now = new Date(),
  onRefresh,
  residency,
  session,
}: WeeklyOverviewPageProps) {
  return (
    <div className="space-y-7">
      <header className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
            <CalendarDaysIcon aria-hidden="true" className="size-4" />
            {formatWeekRange(now, session.community.timezone)}
          </p>
          <h1 className="text-2xl font-semibold text-foreground">Weekly overview</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Review the current administrative position for {session.community.name}.
          </p>
        </div>
        <Button
          aria-label={isRefreshing ? 'Refreshing weekly overview' : 'Refresh weekly overview'}
          disabled={isRefreshing}
          onClick={onRefresh}
          size="icon"
          variant="outline"
        >
          <RefreshCwIcon aria-hidden="true" className={isRefreshing ? 'animate-spin' : undefined} />
        </Button>
      </header>

      {residency ? <ResidencySections session={session} state={residency} /> : null}
      {finance ? <FinanceSection state={finance} /> : null}
    </div>
  );
}
