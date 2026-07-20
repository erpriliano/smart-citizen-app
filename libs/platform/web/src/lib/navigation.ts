import type { SessionContext } from '@smart-citizen/identity-contracts';
import {
  ClipboardCheckIcon,
  FileClockIcon,
  FileTextIcon,
  HistoryIcon,
  HouseIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react';

export type NavigationKey =
  | 'overview'
  | 'houses'
  | 'residents'
  | 'residency-changes'
  | 'financial-reports'
  | 'publications'
  | 'team-access'
  | 'audit-trail'
  | 'community-settings';

export interface NavigationItem {
  key: NavigationKey;
  label: string;
  path: string;
  permission: string | null;
  icon: LucideIcon;
}

const navigationItems: readonly NavigationItem[] = [
  {
    key: 'overview',
    label: 'Overview',
    path: '/',
    permission: null,
    icon: LayoutDashboardIcon,
  },
  {
    key: 'houses',
    label: 'Houses',
    path: '/houses',
    permission: 'residency.record.read',
    icon: HouseIcon,
  },
  {
    key: 'residents',
    label: 'Residents',
    path: '/residents',
    permission: 'residency.record.read',
    icon: UsersIcon,
  },
  {
    key: 'residency-changes',
    label: 'Residency changes',
    path: '/residency-changes',
    permission: 'residency.change.read',
    icon: ClipboardCheckIcon,
  },
  {
    key: 'financial-reports',
    label: 'Financial reports',
    path: '/financial-reports',
    permission: 'finance.report.read',
    icon: FileTextIcon,
  },
  {
    key: 'publications',
    label: 'Publications',
    path: '/publications',
    permission: 'publication.manage',
    icon: FileClockIcon,
  },
  {
    key: 'team-access',
    label: 'Team and access',
    path: '/team-access',
    permission: 'community.access.manage',
    icon: ShieldCheckIcon,
  },
  {
    key: 'audit-trail',
    label: 'Audit trail',
    path: '/audit-trail',
    permission: 'audit.event.read',
    icon: HistoryIcon,
  },
  {
    key: 'community-settings',
    label: 'Community settings',
    path: '/community-settings',
    permission: 'community.settings.manage',
    icon: SettingsIcon,
  },
];

export const allNavigationKeys: ReadonlySet<NavigationKey> = new Set(
  navigationItems.map((item) => item.key),
);

export const sliceOneNavigationKeys: ReadonlySet<NavigationKey> = new Set(['overview']);

export function getPermittedNavigation(
  session: SessionContext,
  enabledNavigation: ReadonlySet<NavigationKey> = sliceOneNavigationKeys,
): NavigationItem[] {
  const permissions = new Set(session.permissions);

  return navigationItems.filter(
    (item) =>
      enabledNavigation.has(item.key) &&
      (item.permission === null || permissions.has(item.permission)),
  );
}
