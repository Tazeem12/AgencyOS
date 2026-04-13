'use client';

import { useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { authFetch } from '@/lib/auth-fetch';
import { ClientModal } from '@/components/client-modal';
import { ContentShell } from '@/components/content-shell';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { Edit2, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function ClientsView() {
  const {
    clients,
    fetchClients,
    fetchStats,
    setClientSearchQuery,
    clientSearchQuery,
    setShowClientModal,
    setEditingClient,
    loading,
  } = useStore();

  const debouncedSearch = useDebouncedValue(clientSearchQuery, 320);

  useEffect(() => {
    void fetchClients();
  }, [debouncedSearch, fetchClients]);

  const searchNow = useCallback(() => {
    void fetchClients();
  }, [fetchClients]);

  const archive = async (id: string) => {
    const res = await authFetch(`/api/clients/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('Could not archive client');
      return;
    }
    toast.success('Client archived');
    void fetchClients();
    void fetchStats();
  };

  return (
    <ContentShell>
      <PageHeader
        title="Clients"
        description="Organizations you work with. Changes sync everywhere projects reference them."
        actions={
          <Button
            onClick={() => {
              setEditingClient(null);
              setShowClientModal(true);
            }}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 shrink-0" />
            Add client
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name, company, or email…"
            value={clientSearchQuery}
            onChange={(e) => setClientSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                searchNow();
              }
            }}
            className="pl-10"
          />
        </div>
        <Button type="button" variant="outline" onClick={searchNow} className="w-full shrink-0 sm:w-auto">
          Search
        </Button>
      </div>

      {loading && (
        <p className="text-sm font-medium text-slate-600">Loading clients…</p>
      )}

      {!loading && clients.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 px-6 py-14 text-center shadow-sm">
          {clientSearchQuery.trim() ? (
            <>
              <p className="text-sm font-medium text-slate-700">No clients match your search</p>
              <p className="mt-1 text-sm text-slate-500">Try different words or clear the search box.</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-slate-700">No clients yet</p>
              <p className="mt-1 text-sm text-slate-500">Add your first client to start linking projects.</p>
            </>
          )}
        </div>
      )}

      {clients.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90">
                  <th className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:px-5">
                    Name
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:px-5">
                    Company
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:px-5">
                    Email
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:px-5">
                    Phone
                  </th>
                  <th className="w-32 whitespace-nowrap px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 sm:px-5">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.map((c) => (
                  <tr key={c.id} className="transition hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-4 py-3.5 font-medium text-slate-900 sm:px-5">{c.name}</td>
                    <td className="px-4 py-3.5 text-slate-600 sm:px-5">{c.company}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-600 sm:px-5">{c.email}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-600 sm:px-5">{c.phone || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 sm:px-5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100"
                          onClick={() => {
                            setEditingClient(c);
                            setShowClientModal(true);
                          }}
                          aria-label={`Edit ${c.name}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-red-600 transition hover:bg-red-50"
                          onClick={() => void archive(c.id)}
                          aria-label={`Archive ${c.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <ClientModal />
    </ContentShell>
  );
}
