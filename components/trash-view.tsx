'use client';

import { useEffect } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { useStore } from '@/lib/store';
import { ContentShell } from '@/components/content-shell';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function TrashView() {
  const { clients, projects, tasks, fetchClients, fetchProjects, fetchTasks, loading } = useStore();

  useEffect(() => {
    void fetchClients(true);
    void fetchProjects(true);
    void fetchTasks(true);
  }, [fetchClients, fetchProjects, fetchTasks]);

  const restoreClient = async (id: string) => {
    const res = await authFetch(`/api/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restore: true }),
    });
    if (!res.ok) {
      toast.error('Restore failed');
      return;
    }
    toast.success('Client restored');
    void fetchClients(true);
    void fetchClients(false);
  };

  const restoreProject = async (id: string) => {
    const res = await authFetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restore: true }),
    });
    if (!res.ok) {
      toast.error('Restore failed');
      return;
    }
    toast.success('Project restored');
    void fetchProjects(true);
    void fetchProjects(false);
  };

  const restoreTask = async (id: string) => {
    const res = await authFetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restore: true }),
    });
    if (!res.ok) {
      toast.error('Restore failed');
      return;
    }
    toast.success('Task restored');
    void fetchTasks(true);
    void fetchTasks(false);
  };

  const permanentDeleteClient = async (id: string) => {
    if (!confirm('Permanently delete this client? This cannot be undone.')) return;
    const res = await authFetch(`/api/clients/${id}?permanent=true`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('Delete failed');
      return;
    }
    toast.success('Deleted');
    void fetchClients(true);
  };

  const permanentDeleteProject = async (id: string) => {
    if (!confirm('Permanently delete this project?')) return;
    const res = await authFetch(`/api/projects/${id}?permanent=true`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('Delete failed');
      return;
    }
    toast.success('Deleted');
    void fetchProjects(true);
  };

  const permanentDeleteTask = async (id: string) => {
    if (!confirm('Permanently delete this task?')) return;
    const res = await authFetch(`/api/tasks/${id}?permanent=true`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('Delete failed');
      return;
    }
    toast.success('Deleted');
    void fetchTasks(true);
  };

  const deletedClients = clients.filter((c) => c.isDeleted);
  const deletedProjects = projects.filter((p) => p.isDeleted);
  const deletedTasks = tasks.filter((t) => t.isDeleted);

  return (
    <ContentShell className="max-w-4xl">
      <PageHeader
        title="Trash"
        description="Soft-deleted records. Restore to bring them back, or remove permanently."
      />

      {loading && <p className="text-sm font-medium text-slate-600">Loading trash…</p>}

      <div className="space-y-10 sm:space-y-12">
        <section>
          <h2 className="border-b border-slate-200 pb-2 text-base font-semibold text-slate-900">Clients</h2>
          <ul className="mt-4 space-y-3">
            {deletedClients.map((c) => (
              <li
                key={c.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <span className="text-sm font-medium text-slate-800">
                  {c.name}
                  <span className="font-normal text-slate-500"> — {c.email}</span>
                </span>
                <div className="flex flex-wrap gap-2 sm:shrink-0">
                  <Button type="button" variant="outline" size="sm" onClick={() => void restoreClient(c.id)}>
                    Restore
                  </Button>
                  <Button type="button" variant="danger" size="sm" onClick={() => void permanentDeleteClient(c.id)}>
                    Delete forever
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          {deletedClients.length === 0 && (
            <p className="mt-3 text-sm text-slate-500">No archived clients.</p>
          )}
        </section>

        <section>
          <h2 className="border-b border-slate-200 pb-2 text-base font-semibold text-slate-900">Projects</h2>
          <ul className="mt-4 space-y-3">
            {deletedProjects.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <span className="text-sm font-medium text-slate-800">{p.title}</span>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => void restoreProject(p.id)}>
                    Restore
                  </Button>
                  <Button type="button" variant="danger" size="sm" onClick={() => void permanentDeleteProject(p.id)}>
                    Delete forever
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          {deletedProjects.length === 0 && (
            <p className="mt-3 text-sm text-slate-500">No archived projects.</p>
          )}
        </section>

        <section>
          <h2 className="border-b border-slate-200 pb-2 text-base font-semibold text-slate-900">Tasks</h2>
          <ul className="mt-4 space-y-3">
            {deletedTasks.map((t) => (
              <li
                key={t.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <span className="text-sm font-medium text-slate-800">{t.title}</span>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => void restoreTask(t.id)}>
                    Restore
                  </Button>
                  <Button type="button" variant="danger" size="sm" onClick={() => void permanentDeleteTask(t.id)}>
                    Delete forever
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          {deletedTasks.length === 0 && <p className="mt-3 text-sm text-slate-500">No archived tasks.</p>}
        </section>
      </div>
    </ContentShell>
  );
}
