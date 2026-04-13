'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useStore } from '@/lib/store';
import { authFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import type { Client, Project } from '@/lib/types';

export function ProjectModal() {
  const {
    showProjectModal,
    editingProject,
    setShowProjectModal,
    setEditingProject,
    fetchProjects,
    fetchStats,
  } = useStore();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [status, setStatus] = useState<Project['status']>('planning');
  /** Full client list for the dropdown — not affected by Clients screen search */
  const [pickerClients, setPickerClients] = useState<Client[]>([]);

  useEffect(() => {
    if (!showProjectModal) return;
    let cancelled = false;
    void (async () => {
      const res = await authFetch('/api/clients');
      if (!res.ok || cancelled) return;
      const data = (await res.json()) as Client[];
      if (!cancelled) setPickerClients(data.filter((c) => !c.isDeleted));
    })();
    return () => {
      cancelled = true;
    };
  }, [showProjectModal]);

  useEffect(() => {
    if (editingProject) {
      setTitle(editingProject.title);
      setDescription(editingProject.description || '');
      setClientId(editingProject.clientId);
      setStatus(editingProject.status);
    } else {
      setTitle('');
      setDescription('');
      const list = pickerClients.filter((c) => !c.isDeleted);
      setClientId(list[0]?.id || '');
      setStatus('planning');
    }
  }, [editingProject, showProjectModal, pickerClients]);

  const close = () => {
    setShowProjectModal(false);
    setEditingProject(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = Boolean(editingProject?.id);
      const url = isEdit ? `/api/projects/${editingProject!.id}` : '/api/projects';
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit
        ? { title, description, status, clientId }
        : { title, description, clientId, status };
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Request failed');
      }
      toast.success(isEdit ? 'Project updated' : 'Project created');
      close();
      await fetchProjects();
      void fetchStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!showProjectModal) return null;

  const clientOptions = pickerClients.filter((c) => !c.isDeleted);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        className="max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-slate-200/90 bg-white p-6 shadow-2xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-600">Projects</p>
            <h2 id="project-modal-title" className="mt-1 text-xl font-bold text-slate-900">
              {editingProject?.id ? 'Edit project' : 'New project'}
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
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Client</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
              required
              disabled={Boolean(editingProject?.id) || clientOptions.length === 0}
            >
              <option value="">{clientOptions.length === 0 ? 'Loading clients…' : 'Select client'}</option>
              {clientOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.company}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Project['status'])}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="w-full sm:w-auto sm:min-w-[120px]" onClick={close}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || (!editingProject?.id && clientOptions.length === 0)}
              className="w-full sm:w-auto sm:min-w-[120px]"
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
