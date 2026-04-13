'use client';

import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
}

export function StatCard({ title, value, icon: Icon, description }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:p-6">
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500/10 to-transparent" aria-hidden />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-4xl">{value}</p>
          {description && <p className="mt-2 text-xs leading-relaxed text-slate-500 sm:text-sm">{description}</p>}
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 p-3.5 ring-1 ring-slate-200/80">
          <Icon className="h-6 w-6 text-indigo-600" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
