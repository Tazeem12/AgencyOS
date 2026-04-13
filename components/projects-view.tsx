'use client';

import { useEffect, useCallback, useState } from 'react';
import { useStore } from '@/lib/store';
import { authFetch } from '@/lib/auth-fetch';
import { ProjectModal } from '@/components/project-modal';
import { ContentShell } from '@/components/content-shell';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const statusLabels: Record<string, string> = {
  planning: 'Planning',
  active: 'Active',
  completed: 'Completed',
};

const selectClass =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 shadow-sm transition focus-visible:border-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/25';

export function ProjectsView() {
  const {
    projects,
    fetchProjects,
    fetchStats,
    setProjectSearchQuery,
    projectSearchQuery,
    setStatusFilter,
    statusFilter,
    setShowProjectModal,
    setEditingProject,
    loading,
  } = useStore();

  const debouncedTitleSearch = useDebouncedValue(projectSearchQuery, 320);
  const [hasAnyClient, setHasAnyClient] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await authFetch('/api/clients');
      if (!res.ok || cancelled) return;
      const data = (await res.json()) as { isDeleted?: boolean }[];
      if (!cancelled) setHasAnyClient(data.some((c) => !c.isDeleted));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void fetchProjects();
  }, [debouncedTitleSearch, statusFilter, fetchProjects]);

  const applyFiltersNow = useCallback(() => {
    void fetchProjects();
  }, [fetchProjects]);

  const archive = async (id: string) => {
    const res = await authFetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('Could not archive project');
      return;
    }
    toast.success('Project archived');
    void fetchProjects();
    void fetchStats();
  };

  return (
    <ContentShell>
      <PageHeader
        title="Projects"
        description="Workstreams tied to clients. Status can move to completed automatically when all tasks finish."
        actions={
          <Button
            onClick={() => {
              setEditingProject(null);
              setShowProjectModal(true);
            }}
            disabled={hasAnyClient === false}
            className="w-full sm:w-auto"
            title={hasAnyClient === false ? 'Add a client first' : undefined}
          >
            <Plus className="h-4 w-4 shrink-0" />
            New project
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-5">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Search title
          </label>
          <Input
            value={projectSearchQuery}
            onChange={(e) => setProjectSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyFiltersNow();
              }
            }}
            placeholder="Filter by title…"
          />
        </div>
        <div className="sm:col-span-1 lg:col-span-3">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">All statuses</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="flex sm:col-span-2 lg:col-span-4">
          <Button
            type="button"
            variant="outline"
            className="w-full lg:w-auto lg:min-w-[140px]"
            onClick={applyFiltersNow}
          >
            Apply filters
          </Button>
        </div>
      </div>

      {loading && <p className="text-sm font-medium text-slate-600">Loading projects…</p>}

      {!loading && projects.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 px-6 py-14 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-700">No projects match your filters</p>
          <p className="mt-1 text-sm text-slate-500">Create a project linked to a client, or adjust filters.</p>
        </div>
      )}

      <div className="space-y-3 sm:space-y-4">
        {projects.map((p) => (
          <div
            key={p.id}
            className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-5"
          >
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-900">{p.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                <span className="font-medium text-slate-700">{p.clientName}</span>
                {p.description ? ` — ${p.description}` : ''}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-800 ring-1 ring-indigo-100">
                {statusLabels[p.status] || p.status}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100"
                  onClick={() => {
                    setEditingProject(p);
                    setShowProjectModal(true);
                  }}
                  aria-label={`Edit ${p.title}`}
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-red-600 transition hover:bg-red-50"
                  onClick={() => void archive(p.id)}
                  aria-label={`Archive ${p.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <ProjectModal />
    </ContentShell>
  );
}
