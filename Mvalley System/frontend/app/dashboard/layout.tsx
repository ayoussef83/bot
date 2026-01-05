'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import DashboardSidebar from '@/components/DashboardSidebar';
import UserProfileMenu from '@/components/UserProfileMenu';
import { FiMenu, FiX } from 'react-icons/fi';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userStr));
  }, [router]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

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
      case 'hr':
        return '/dashboard/hr';
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
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <DashboardSidebar
        userRole={user.role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-64 w-full md:w-auto">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                aria-label="Toggle menu"
              >
                {sidebarOpen ? (
                  <FiX className="w-6 h-6" />
                ) : (
                  <FiMenu className="w-6 h-6" />
                )}
              </button>
              {/* User Profile Menu - Always on the right */}
              <div className="ml-auto">
                <UserProfileMenu user={user} onLogout={handleLogout} />
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
