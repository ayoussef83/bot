'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { FiChevronRight } from 'react-icons/fi';

const pathMap: { [key: string]: string } = {
  '/dashboard/settings': 'Settings',
  '/dashboard/settings/general': 'General',
  '/dashboard/settings/organization': 'Organization',
  '/dashboard/settings/users-roles': 'Users & Roles',
  '/dashboard/settings/security': 'Security',
  '/dashboard/settings/communications': 'Communications',
  '/dashboard/settings/communications/providers': 'Providers',
  '/dashboard/settings/communications/templates': 'Templates',
  '/dashboard/settings/communications/logs': 'Logs',
  '/dashboard/settings/scheduling': 'Scheduling',
  '/dashboard/settings/finance': 'Finance',
  '/dashboard/settings/finance/payments': 'Payments',
  '/dashboard/settings/finance/expenses': 'Expenses',
  '/dashboard/settings/finance/taxes': 'Taxes',
  '/dashboard/settings/custom-fields': 'Custom Fields',
  '/dashboard/settings/integrations': 'Integrations',
  '/dashboard/settings/advanced': 'Advanced',
};

export default function SettingsBreadcrumbs() {
  const pathname = usePathname();

  if (!pathname) return null;

  // Build breadcrumb path
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: { label: string; path: string }[] = [];

  // Always start with Settings
  breadcrumbs.push({ label: 'Settings', path: '/dashboard/settings' });

  // Build path incrementally
  let currentPath = '/dashboard/settings';
  for (let i = 2; i < segments.length; i++) {
    currentPath += '/' + segments[i];
    const label = pathMap[currentPath] || segments[i].charAt(0).toUpperCase() + segments[i].slice(1).replace(/-/g, ' ');
    breadcrumbs.push({ label, path: currentPath });
  }

  return (
    <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.path} className="flex items-center gap-2">
          {index > 0 && <FiChevronRight className="w-4 h-4 text-gray-400" />}
          {index === breadcrumbs.length - 1 ? (
            <span className="text-gray-900 font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.path} className="hover:text-gray-700">
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}






