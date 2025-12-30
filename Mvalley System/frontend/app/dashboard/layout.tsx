'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import DashboardSidebar from '@/components/DashboardSidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userStr));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  const getDashboardPath = (role: string): string => {
    switch (role) {
      case 'super_admin':
      case 'management':
        return '/dashboard/management';
      case 'operations':
        return '/dashboard/ops';
      case 'accounting':
        return '/dashboard/accounting';
      case 'instructor':
        return '/dashboard/instructor';
      default:
        return '/dashboard/management';
    }
  };

  // Generate user initials for avatar
  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="flex min-h-screen bg-gray-900">
      {/* Left Sidebar */}
      <DashboardSidebar userRole={user.role} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-gray-800 border-b border-gray-700">
          <div className="px-6 py-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Link href={getDashboardPath(user.role)} className="flex items-center">
                  {!logoError ? (
                    <Image
                      src="/mindvalley-logo.png"
                      alt="MindValley"
                      height={32}
                      width={120}
                      className="h-8 w-auto object-contain"
                      unoptimized
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <h1 className="text-lg font-bold text-white">MV-OS</h1>
                  )}
                </Link>
              </div>
              <div className="flex items-center gap-4">
                {/* User Profile Section */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                    {getUserInitials(user.firstName, user.lastName)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="text-xs text-gray-400 capitalize">
                      {user.role.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-400 hover:text-white transition-colors whitespace-nowrap"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-900">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
