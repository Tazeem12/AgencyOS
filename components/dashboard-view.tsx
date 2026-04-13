'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';
import { ContentShell } from '@/components/content-shell';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { FolderOpen, Kanban, Users, CheckCircle2, ListTodo, Clock, Trophy } from 'lucide-react';

export function DashboardView() {
  const { stats, fetchStats, loading, error } = useStore();

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  if (loading && !stats) {
    return (
      <ContentShell>
        <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/80 py-16">
          <p className="text-sm font-medium text-slate-600">Loading dashboard…</p>
        </div>
      </ContentShell>
    );
  }

  if (error && !stats) {
    return (
      <ContentShell>
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      </ContentShell>
    );
  }

  const s = stats;

  return (
    <ContentShell>
      <PageHeader
        title="Dashboard"
        description="Live overview of clients, projects, and task flow across your workspace."
      />
      {s && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            <StatCard title="Total clients" value={s.clients.total} icon={Users} />
            <StatCard
              title="Projects"
              value={s.projects.total}
              icon={FolderOpen}
              description={`${s.projects.active} active · ${s.projects.planning} planning`}
            />
            <StatCard
              title="Projects completed"
              value={s.projects.completed}
              icon={Trophy}
              description="Auto-marked when all tasks are done"
            />
          </div>
          <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            <StatCard title="Total tasks" value={s.tasks.total} icon={Kanban} />
            <StatCard title="To do" value={s.tasks.todo} icon={ListTodo} />
            <StatCard title="In progress" value={s.tasks.inProgress} icon={Clock} />
            <StatCard title="Done" value={s.tasks.done} icon={CheckCircle2} />
          </div>
          <div className="mt-6 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:mt-8 sm:p-6">
            <h2 className="text-base font-semibold text-slate-900">Tasks by priority</h2>
            <div className="mt-4 flex flex-wrap gap-3 sm:gap-6">
              {(
                [
                  ['High', s.tasks.byPriority.high],
                  ['Medium', s.tasks.byPriority.medium],
                  ['Low', s.tasks.byPriority.low],
                ] as const
              ).map(([label, count]) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
                >
                  <span className="font-medium text-slate-500">{label}</span>
                  <span className="font-bold tabular-nums text-slate-900">{count}</span>
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </ContentShell>
  );
}
