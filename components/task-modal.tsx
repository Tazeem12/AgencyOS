'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useStore } from '@/lib/store';
import { authFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import type { Project, Task } from '@/lib/types';

export function TaskModal() {
  const {
    showTaskModal,
    editingTask,
    setShowTaskModal,
    setEditingTask,
    fetchTasks,
    fetchStats,
  } = useStore();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  /** Full project list for the dropdown — not affected by Projects screen filters */
  const [pickerProjects, setPickerProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!showTaskModal) return;
    let cancelled = false;
    void (async () => {
      const res = await authFetch('/api/projects');
      if (!res.ok || cancelled) return;
      const data = (await res.json()) as Project[];
      if (!cancelled) setPickerProjects(data.filter((p) => !p.isDeleted));
    })();
    return () => {
      cancelled = true;
    };
  }, [showTaskModal]);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setProjectId(editingTask.projectId);
      setPriority(editingTask.priority);
    } else {
      setTitle('');
      setDescription('');
      const list = pickerProjects.filter((p) => !p.isDeleted);
      const active = list.find((p) => p.status !== 'completed');
      setProjectId(active?.id || list[0]?.id || '');
      setPriority('medium');
    }
  }, [editingTask, showTaskModal, pickerProjects]);

  const close = () => {
    setShowTaskModal(false);
    setEditingTask(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = Boolean(editingTask?.id);
      const url = isEdit ? `/api/tasks/${editingTask!.id}` : '/api/tasks';
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit
        ? { title, description, priority }
        : { title, description, projectId, priority };
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Request failed');
      }
      toast.success(isEdit ? 'Task updated' : 'Task created');
      close();
      await fetchTasks();
      void fetchStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!showTaskModal) return null;

  const projectOptions = pickerProjects.filter((p) => !p.isDeleted);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        className="max-h-[95vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-slate-200/90 bg-white p-6 shadow-2xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-600">Tasks</p>
            <h2 id="task-modal-title" className="mt-1 text-xl font-bold text-slate-900">
              {editingTask?.id ? 'Edit task' : 'New task'}
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              placeholder="Optional"
            />
          </div>
          {!editingTask?.id && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                required
                disabled={projectOptions.length === 0}
              >
                {projectOptions.length === 0 ? (
                  <option value="">Loading projects…</option>
                ) : (
                  projectOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))
                )}
              </select>
              {projectOptions.length === 0 && (
                <p className="mt-2 text-xs text-slate-500">Create a project first if the list stays empty.</p>
              )}
            </div>
          )}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Task['priority'])}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="w-full sm:w-auto sm:min-w-[120px]" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || (!editingTask?.id && projectOptions.length === 0)} className="w-full sm:w-auto sm:min-w-[120px]">
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
