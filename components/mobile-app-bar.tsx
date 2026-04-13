'use client';

import { Menu } from 'lucide-react';

const viewLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  clients: 'Clients',
  projects: 'Projects',
  kanban: 'Kanban',
  activity: 'Activity',
  trash: 'Trash',
};

export function MobileAppBar({
  currentView,
  onOpenMenu,
}: {
  currentView: string;
  onOpenMenu: () => void;
}) {
  const title = viewLabels[currentView] ?? 'Agency Tool';

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200/90 bg-white/90 px-3 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/75 sm:px-4 md:hidden">
      <button
        type="button"
        onClick={onOpenMenu}
        className="inline-flex h-11 min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" strokeWidth={2} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-600/90">Agency Tool</p>
        <h2 className="truncate text-base font-semibold tracking-tight text-slate-900">{title}</h2>
      </div>
    </header>
  );
}
