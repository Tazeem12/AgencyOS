'use client';

import type { Task } from '@/lib/types';
import { useStore } from '@/lib/store';
import { authFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';
import { ChevronRight, Pencil, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

function nextStatus(s: Task['status']): Task['status'] | null {
  if (s === 'todo') return 'in-progress';
  if (s === 'in-progress') return 'done';
  return null;
}

const labels: Record<Task['status'], string> = {
  todo: 'To do',
  'in-progress': 'In progress',
  done: 'Done',
};

export function TaskCard({
  task,
  columnStatus,
  onMoveToColumn,
}: {
  task: Task;
  columnStatus: Task['status'];
  onMoveToColumn: (taskId: string, newStatus: Task['status']) => void;
}) {
  const { updateTask, fetchTasks, fetchStats, setEditingTask, setShowTaskModal } = useStore();
  const n = nextStatus(task.status);

  const applyStatus = async (newStatus: Task['status']) => {
    if (task.status === newStatus) return;
    const res = await authFetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      toast.error('Could not update task');
      return;
    }
    const updated = (await res.json()) as Task;
    updateTask(updated);
    void fetchTasks();
    void fetchStats();
  };

  const advance = async () => {
    if (!n) return;
    await applyStatus(n);
  };

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('taskId', task.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const draggedId = e.dataTransfer.getData('taskId');
        if (draggedId) onMoveToColumn(draggedId, columnStatus);
      }}
      className="cursor-grab rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-100 transition hover:border-slate-300 hover:shadow-md active:cursor-grabbing sm:p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 gap-2">
          <span className="mt-1 text-slate-300" title="Drag handle">
            <GripVertical className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-snug text-slate-900">{task.title}</p>
            <p className="mt-1.5 text-xs text-slate-500">
              {task.projectTitle}
              {task.clientName ? ` · ${task.clientName}` : ''}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                {labels[task.status]}
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                {task.priority} priority
              </span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            onClick={() => {
              setEditingTask(task);
              setShowTaskModal(true);
            }}
            title="Edit task"
          >
            <Pencil className="h-4 w-4" />
          </button>
          {n && (
            <Button type="button" variant="outline" size="sm" className="h-9 gap-1 px-2 text-xs" onClick={() => void advance()}>
              Move
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
