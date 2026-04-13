'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { AdvancedAuth } from '@/components/advanced-auth';
import { Sidebar } from '@/components/sidebar';
import { MobileAppBar } from '@/components/mobile-app-bar';
import { DashboardView } from '@/components/dashboard-view';
import { ClientsView } from '@/components/clients-view';
import { ProjectsView } from '@/components/projects-view';
import { KanbanView } from '@/components/kanban-view';
import { ActivityView } from '@/components/activity-view';
import { TrashView } from '@/components/trash-view';
import { useStore } from '@/lib/store';
import { Loader2 } from 'lucide-react';


export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { currentView } = useStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)]">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200/80 bg-white px-10 py-12 shadow-lg">
          <Loader2 className="h-9 w-9 animate-spin text-indigo-600" aria-hidden />
          <p className="text-sm font-medium text-slate-600">Signing you in…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AdvancedAuth />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'clients':
        return <ClientsView />;
      case 'projects':
        return <ProjectsView />;
      case 'kanban':
        return <KanbanView />;
      case 'activity':
        return <ActivityView />;
      case 'trash':
        return <TrashView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--app-bg)]">
      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[2px] transition-opacity md:hidden"
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <Sidebar mobileOpen={mobileNavOpen} onNavigate={() => setMobileNavOpen(false)} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:ml-0">
        <MobileAppBar currentView={currentView} onOpenMenu={() => setMobileNavOpen(true)} />
        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">{renderView()}</main>
      </div>
    </div>
  );
}
