import type { SupabaseClient } from '@supabase/supabase-js';
import type { DashboardStats } from '@/lib/types';

/**
 * Aggregates dashboard metrics for a single user (used by GET /api/stats).
 * Business rules for project completion from tasks live in DB triggers + task PATCH handler.
 */
export async function buildDashboardStats(
  supabase: SupabaseClient,
  userId: string
): Promise<DashboardStats> {
  const { count: totalClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_deleted', false);

  const { data: projectsData } = await supabase
    .from('projects')
    .select('status')
    .eq('user_id', userId)
    .eq('is_deleted', false);

  const totalProjects = projectsData?.length || 0;
  const completedProjects = projectsData?.filter((p) => p.status === 'completed').length || 0;
  const activeProjects = projectsData?.filter((p) => p.status === 'active').length || 0;
  const planningProjects = projectsData?.filter((p) => p.status === 'planning').length || 0;

  const { data: tasksData } = await supabase
    .from('tasks')
    .select('status, priority')
    .eq('user_id', userId)
    .eq('is_deleted', false);

  const totalTasks = tasksData?.length || 0;
  const todoTasks = tasksData?.filter((t) => t.status === 'todo').length || 0;
  const inProgressTasks = tasksData?.filter((t) => t.status === 'in-progress').length || 0;
  const doneTasks = tasksData?.filter((t) => t.status === 'done').length || 0;
  const highPriorityTasks = tasksData?.filter((t) => t.priority === 'high').length || 0;
  const mediumPriorityTasks = tasksData?.filter((t) => t.priority === 'medium').length || 0;
  const lowPriorityTasks = tasksData?.filter((t) => t.priority === 'low').length || 0;

  return {
    clients: { total: totalClients || 0 },
    projects: {
      total: totalProjects,
      completed: completedProjects,
      active: activeProjects,
      planning: planningProjects,
    },
    tasks: {
      total: totalTasks,
      todo: todoTasks,
      inProgress: inProgressTasks,
      done: doneTasks,
      byPriority: {
        high: highPriorityTasks,
        medium: mediumPriorityTasks,
        low: lowPriorityTasks,
      },
    },
  };
}
