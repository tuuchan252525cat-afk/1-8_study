import { AppTab } from '../types';

export const VALID_TABS: readonly AppTab[] = [
  'portal',
  'home',
  'scores',
  'tests',
  'quiz',
  'ai_analyzer',
  'periodic_predicted',
  'materials',
  'forum',
  'mypage',
  'edit',
];

/**
 * Returns the application's base pathname, dynamically preserving GitHub Pages
 * repository subpaths (e.g. /1-8_study/) and standard root paths (/).
 */
export const getAppBasePath = (): string => {
  if (typeof window === 'undefined') return '/';

  // 1. If Vite has an explicit non-relative base (e.g. from GITHUB_REPOSITORY in CI)
  const envBase =
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.BASE_URL
      : undefined;
  if (envBase && envBase !== './' && envBase !== '.') {
    return envBase.endsWith('/') ? envBase : `${envBase}/`;
  }

  // 2. Derive base pathname from window.location.pathname
  const pathname = window.location.pathname;
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length > 0) {
    // If the path ends with a route like 'edit', exclude it to find the base repository path
    if (segments[segments.length - 1] === 'edit') {
      const parentSegments = segments.slice(0, -1);
      return parentSegments.length > 0 ? `/${parentSegments.join('/')}/` : '/';
    }
    // E.g. ["1-8_study"] -> "/1-8_study/"
    return `/${segments.join('/')}/`;
  }

  return '/';
};

/**
 * Parses the current location (hash, search param, or direct pathname) to determine the active tab.
 * Gives precedence to hash for 100% reload durability on static hosts like GitHub Pages.
 */
export const getTabFromLocation = (): AppTab => {
  if (typeof window === 'undefined') return 'portal';

  // 1. Check Hash: e.g. "#/edit", "#edit", "#/scores", "#scores"
  const hashRaw = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
  if (hashRaw && VALID_TABS.includes(hashRaw as AppTab)) {
    return hashRaw as AppTab;
  }

  // 2. Check Search params: e.g. "?tab=edit", "?edit"
  const searchParams = new URLSearchParams(window.location.search);
  const tabParam = searchParams.get('tab')?.toLowerCase();
  if (tabParam && VALID_TABS.includes(tabParam as AppTab)) {
    return tabParam as AppTab;
  }
  if (searchParams.has('edit')) {
    return 'edit';
  }

  // 3. Check direct pathname: e.g. "/edit" or "/1-8_study/edit"
  const cleanPath = window.location.pathname.replace(/\/+$/, '');
  if (cleanPath.endsWith('/edit')) {
    return 'edit';
  }

  return 'portal';
};

/**
 * Builds the URL for a tab, preserving the repository subpath on GitHub Pages.
 * - portal => "/1-8_study/"
 * - edit   => "/1-8_study/#/edit"
 * - scores => "/1-8_study/#/scores"
 */
export const getTabUrl = (tab: AppTab): string => {
  const base = getAppBasePath();
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;

  if (tab === 'portal') {
    return normalizedBase;
  }
  return `${normalizedBase}#/${tab}`;
};

/**
 * Detects whether the app is hosted on a static hosting environment without an Express backend
 * (such as GitHub Pages or file: protocol).
 */
export const isStaticDeployment = (): boolean => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  return host.includes('github.io') || window.location.protocol === 'file:';
};
