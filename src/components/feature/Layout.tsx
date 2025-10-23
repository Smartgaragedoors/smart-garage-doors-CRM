
import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { isDemoEnvironment } from '../../lib/supabase';
import { SidebarProvider } from '../../contexts/SidebarContext';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          {isDemoEnvironment && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 px-6 py-3">
              <div className="flex items-center text-amber-800 text-sm">
                <i className="ri-information-line mr-2 text-lg"></i>
                <span className="font-medium">Demo Mode:</span>
                <span className="ml-1">Using sample data. Configure Supabase environment variables for full functionality.</span>
              </div>
            </div>
          )}
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}