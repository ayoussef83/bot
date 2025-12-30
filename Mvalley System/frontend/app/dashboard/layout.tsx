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

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Left Sidebar */}
      <DashboardSidebar userRole={user.role} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Link href={getDashboardPath(user.role)} className="flex items-center">
                  {!logoError ? (
                    <Image
                      src="/mindvalley-logo.png"
                      alt="MindValley"
                      height={60}
                      width={180}
                      className="h-15 w-auto object-contain"
                      style={{ width: 'auto' }}
                      unoptimized
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <h1 className="text-xl font-bold">MV-OS</h1>
                  )}
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700 whitespace-nowrap">
                  {user.firstName} {user.lastName} ({user.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-gray-700 whitespace-nowrap"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
