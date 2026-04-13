'use client';

import { useCallback, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { authFetch } from '@/lib/auth-fetch';
import { KanbanColumn } from '@/components/kanban-column';
import { TaskModal } from '@/components/task-modal';
import { ContentShell } from '@/components/content-shell';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { Task } from '@/lib/types';

const selectClass =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 shadow-sm focus-visible:border-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/25';

export function KanbanView() {
  const {
    tasks,
    projects,
    fetchTasks,
    fetchProjects,
    fetchStats,
    setShowTaskModal,
    setEditingTask,
    loading,
    taskSearchQuery,
    setTaskSearchQuery,
    selectedProjectId,
    setSelectedProjectId,
    priorityFilter,
    setPriorityFilter,
  } = useStore();

  const debouncedTaskSearch = useDebouncedValue(taskSearchQuery, 320);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    void fetchTasks();
  }, [debouncedTaskSearch, selectedProjectId, priorityFilter, fetchTasks]);

  useEffect(() => {
    return () => {
      useStore.getState().setTaskSearchQuery('');
      useStore.getState().setSelectedProjectId(null);
      useStore.getState().setPriorityFilter('');
    };
  }, []);

  const moveTask = useCallback(
    async (taskId: string, newStatus: Task['status']) => {
      const task = useStore.getState().tasks.find((t) => t.id === taskId);
      if (task?.status === newStatus) return;
      const res = await authFetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        toast.error('Could not move task');
        return;
      }
      const updated = (await res.json()) as Task;
      useStore.getState().updateTask(updated);
      void fetchTasks();
      void fetchStats();
    },
    [fetchTasks, fetchStats]
  );

  const fetchTasksNow = useCallback(() => {
    void fetchTasks();
  }, [fetchTasks]);

  const todo = tasks.filter((t) => t.status === 'todo');
  const doing = tasks.filter((t) => t.status === 'in-progress');
  const done = tasks.filter((t) => t.status === 'done');

  const activeProjects = projects.filter((p) => !p.isDeleted);

  return (
    <ContentShell>
      <PageHeader
        title="Kanban"
        description="Drag cards between columns or use Move. Every change is saved and project completion is recalculated on the server."
        actions={
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              setEditingTask(null);
              setShowTaskModal(true);
            }}
          >
            <Plus className="h-4 w-4 shrink-0" />
            New task
          </Button>
        }
      />

      <div className="mb-6 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Filters</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-5">
            <label className="mb-2 block text-xs font-medium text-slate-600">Search by title</label>
            <Input
              value={taskSearchQuery}
              onChange={(e) => setTaskSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  fetchTasksNow();
                }
              }}
              placeholder="Task title…"
            />
          </div>
          <div className="lg:col-span-4">
            <label className="mb-2 block text-xs font-medium text-slate-600">Project</label>
            <select
              value={selectedProjectId ?? ''}
              onChange={(e) => setSelectedProjectId(e.target.value || null)}
              className={selectClass}
            >
              <option value="">All projects</option>
              {activeProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="mb-2 block text-xs font-medium text-slate-600">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className={selectClass}
            >
              <option value="">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {loading && <p className="text-sm font-medium text-slate-600">Loading board…</p>}

      {!loading && tasks.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 px-6 py-14 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-700">No tasks match your filters</p>
          <p className="mt-1 text-sm text-slate-500">Add tasks from a project or clear filters.</p>
        </div>
      )}

      {tasks.length > 0 && (
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-4">
          <KanbanColumn title="To do" tasks={todo} columnStatus="todo" onDropTask={moveTask} />
          <KanbanColumn title="In progress" tasks={doing} columnStatus="in-progress" onDropTask={moveTask} />
          <KanbanColumn title="Done" tasks={done} columnStatus="done" onDropTask={moveTask} />
        </div>
      )}
      <TaskModal />
    </ContentShell>
  );
}
