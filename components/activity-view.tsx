'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';
import { ContentShell } from '@/components/content-shell';
import { PageHeader } from '@/components/page-header';
import { formatDistanceToNow } from 'date-fns';
import { Activity } from 'lucide-react';

export function ActivityView() {
  const { activityLogs, fetchActivityLogs, loading } = useStore();

  useEffect(() => {
    void fetchActivityLogs();
  }, [fetchActivityLogs]);

  return (
    <ContentShell className="max-w-3xl">
      <PageHeader
        title="Activity"
        description="Audit trail of creates, updates, and deletes across your workspace."
      />

      {loading && <p className="text-sm font-medium text-slate-600">Loading activity…</p>}

      <ul className="mt-2 space-y-3 sm:space-y-4">
        {activityLogs.map((log) => (
          <li
            key={log.id}
            className="group rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:p-5"
          >
            <div className="flex gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <Activity className="h-4 w-4" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug text-slate-900">{log.description}</p>
                <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700">
                    {log.action}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span>{log.entityType}</span>
                  {log.createdAt && (
                    <>
                      <span className="text-slate-400">·</span>
                      <time dateTime={log.createdAt}>
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </time>
                    </>
                  )}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {!loading && activityLogs.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-white/80 py-14 text-center">
          <p className="text-sm font-medium text-slate-600">No activity recorded yet.</p>
        </div>
      )}
    </ContentShell>
  );
}
