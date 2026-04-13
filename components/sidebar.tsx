'use client';

import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import {
  Activity,
  FolderOpen,
  Kanban,
  LayoutDashboard,
  LogOut,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ViewType } from '@/lib/types';

const navItems: Array<{ id: ViewType; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'kanban', label: 'Kanban', icon: Kanban },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'trash', label: 'Trash', icon: Trash2 },
];

type SidebarProps = {
  mobileOpen?: boolean;
  onNavigate?: () => void;
};

export function Sidebar({ mobileOpen = true, onNavigate }: SidebarProps) {
  const { currentView, setCurrentView } = useStore();
  const { user, logout } = useAuth();

  const go = (id: ViewType) => {
    setCurrentView(id);
    onNavigate?.();
  };

  return (
    <aside
      className={cn(
        'flex h-screen w-[min(18rem,100vw)] max-w-[85vw] shrink-0 flex-col border-r border-white/10 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white shadow-2xl',
        'fixed left-0 top-0 z-50 transition-transform duration-300 ease-out md:static md:z-0 md:max-w-none md:w-64 md:translate-x-0 md:shadow-none',
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}
      aria-label="Main navigation"
    >
      <div className="flex items-start justify-between gap-2 border-b border-white/10 p-5 md:p-6">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-300/90">Workspace</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-white">Agency Tool</h1>
          <p className="mt-0.5 text-xs text-slate-400">Operations hub</p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate?.()}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white md:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="border-b border-white/10 px-4 py-4 md:px-5">
        <p className="truncate text-sm font-medium text-slate-200">{user?.email}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500">{user?.name}</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3 md:p-4" role="navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => go(item.id)}
              className={cn(
                'flex min-h-[44px] w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all',
                isActive
                  ? 'bg-white/12 text-white shadow-inner ring-1 ring-white/15'
                  : 'text-slate-300 hover:bg-white/6 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5 shrink-0 opacity-90" strokeWidth={isActive ? 2.25 : 2} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/10 p-3 md:p-4">
        <button
          type="button"
          onClick={() => void logout()}
          className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-300 transition hover:bg-red-500/15 hover:text-red-100"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span>Log out</span>
        </button>
      </div>
      <div className="border-t border-white/10 px-4 py-3">
        <p className="text-center text-[10px] font-medium uppercase tracking-wider text-slate-600">v1.0</p>
      </div>
    </aside>
  );
}
