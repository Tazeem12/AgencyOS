'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useStore } from '@/lib/store';
import { authFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { toast } from 'sonner';

export function ClientModal() {
  const { showClientModal, editingClient, setShowClientModal, setEditingClient, fetchClients, fetchStats } =
    useStore();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (editingClient) {
      setName(editingClient.name);
      setCompany(editingClient.company);
      setEmail(editingClient.email);
      setPhone(editingClient.phone || '');
    } else {
      setName('');
      setCompany('');
      setEmail('');
      setPhone('');
    }
  }, [editingClient, showClientModal]);

  const close = () => {
    setShowClientModal(false);
    setEditingClient(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = Boolean(editingClient?.id);
      const url = isEdit ? `/api/clients/${editingClient!.id}` : '/api/clients';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, company, email, phone: phone || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Request failed');
      }
      toast.success(isEdit ? 'Client updated' : 'Client created');
      close();
      await fetchClients();
      void fetchStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!showClientModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        className="max-h-[95vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-slate-200/90 bg-white p-6 shadow-2xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-modal-title"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-600">Clients</p>
            <h2 id="client-modal-title" className="mt-1 text-xl font-bold text-slate-900">
              {editingClient?.id ? 'Edit client' : 'New client'}
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
            <label className="mb-2 block text-sm font-semibold text-slate-800">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="organization" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Company</label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Phone</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" type="tel" />
          </div>
          <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="w-full sm:w-auto sm:min-w-[120px]" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="w-full sm:w-auto sm:min-w-[120px]">
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
