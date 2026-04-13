'use client';

import type { Task } from '@/lib/types';
import { TaskCard } from '@/components/task-card';

export function KanbanColumn({
  title,
  tasks,
  columnStatus,
  onDropTask,
}: {
  title: string;
  tasks: Task[];
  columnStatus: Task['status'];
  onDropTask: (taskId: string, newStatus: Task['status']) => void;
}) {
  return (
    <div
      className="flex min-h-[min(360px,50vh)] flex-1 flex-col rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/90 to-white p-3 shadow-sm sm:min-h-[380px] sm:p-4"
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(e) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (taskId) onDropTask(taskId, columnStatus);
      }}
    >
      <h3 className="mb-3 flex items-baseline justify-between gap-2 border-b border-slate-200/80 pb-3">
        <span className="text-sm font-semibold tracking-tight text-slate-900">{title}</span>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold tabular-nums text-slate-600 ring-1 ring-slate-200">
          {tasks.length}
        </span>
      </h3>
      <div className="flex flex-1 flex-col gap-3">
        {tasks.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/50 py-10 text-center">
            <p className="text-xs font-medium text-slate-500">Drop a task here</p>
          </div>
        ) : (
          tasks.map((t) => (
            <TaskCard key={t.id} task={t} columnStatus={columnStatus} onMoveToColumn={onDropTask} />
          ))
        )}
      </div>
    </div>
  );
}
