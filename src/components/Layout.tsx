import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';

interface LayoutProps {
  role: 'resident' | 'company' | 'admin';
  userName: string;
}

export function Layout({ role, userName }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar
        role={role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:ml-64">
        <Header
          userName={userName}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
