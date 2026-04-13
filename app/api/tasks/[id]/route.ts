import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, requireUserId } from '@/lib/route-auth';

type ProjectsJoin = { title?: string } | null;

function projectTitle(projects: unknown): string {
  if (!projects || typeof projects !== 'object') return 'Unknown';
  return (projects as ProjectsJoin)?.title || 'Unknown';
}

async function assertTaskOwner(
  supabase: ReturnType<typeof createServiceClient>,
  id: string,
  userId: string
) {
  const { data, error } = await supabase.from('tasks').select('user_id').eq('id', id).single();
  if (error || !data || data.user_id !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;
    const { id } = await params;
    const supabase = createServiceClient();
    const denied = await assertTaskOwner(supabase, id, userId);
    if (denied) return denied;

    const { data, error } = await supabase
      .from('tasks')
      .select(
        `
        id,
        title,
        description,
        status,
        priority,
        project_id,
        user_id,
        is_deleted,
        created_at,
        updated_at,
        projects ( id, title )
      `
      )
      .eq('id', id)
      .single();
    if (error || !data) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json({
      id: data.id,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      projectId: data.project_id,
      projectTitle: projectTitle(data.projects),
      userId: data.user_id,
      isDeleted: data.is_deleted,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (error) {
    console.error('Fetch task error:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;
    const { id } = await params;
    const supabase = createServiceClient();
    const denied = await assertTaskOwner(supabase, id, userId);
    if (denied) return denied;

    const body = await req.json();
    const { title, description, priority } = body;
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tasks')
      .update({
        title,
        description: description || null,
        priority: priority || 'medium',
      })
      .eq('id', id)
      .select(
        `
        id,
        title,
        description,
        status,
        priority,
        project_id,
        user_id,
        is_deleted,
        created_at,
        updated_at,
        projects ( id, title )
      `
      )
      .single();
    if (error) throw new Error(error.message);

    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'UPDATE_TASK',
      entity_type: 'task',
      entity_id: id,
      description: `Updated task: ${title}`,
    });

    return NextResponse.json({
      id: data.id,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      projectId: data.project_id,
      projectTitle: projectTitle(data.projects),
      userId: data.user_id,
      isDeleted: data.is_deleted,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;
    const { id } = await params;
    const supabase = createServiceClient();
    const denied = await assertTaskOwner(supabase, id, userId);
    if (denied) return denied;

    const body = await req.json();
    const { status, restore } = body;

    if (restore) {
      const { data, error } = await supabase
        .from('tasks')
        .update({ is_deleted: false })
        .eq('id', id)
        .select(
          `
          id,
          title,
          description,
          status,
          priority,
          project_id,
          user_id,
          is_deleted,
          created_at,
          updated_at,
          projects ( id, title )
        `
        )
        .single();
      if (error) throw new Error(error.message);

      await supabase.from('activity_logs').insert({
        user_id: userId,
        action: 'RESTORE_TASK',
        entity_type: 'task',
        entity_id: id,
        description: `Restored task: ${data.title}`,
      });

      return NextResponse.json({
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        projectId: data.project_id,
        projectTitle: projectTitle(data.projects),
        userId: data.user_id,
        isDeleted: data.is_deleted,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      });
    }

    if (status) {
      const { data: updatedTask, error: updateError } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', id)
        .select(
          `
          id,
          title,
          description,
          status,
          priority,
          project_id,
          user_id,
          is_deleted,
          created_at,
          updated_at,
          projects ( id, title )
        `
        )
        .single();
      if (updateError) throw new Error(updateError.message);

      const projectId = updatedTask.project_id;
      const { data: allProjectTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('status')
        .eq('project_id', projectId)
        .eq('is_deleted', false);
      if (!tasksError && allProjectTasks) {
        const allDone = allProjectTasks.every((task) => task.status === 'done');
        if (allDone && allProjectTasks.length > 0) {
          await supabase.from('projects').update({ status: 'completed' }).eq('id', projectId);
        } else {
          const { data: project } = await supabase
            .from('projects')
            .select('status, user_id')
            .eq('id', projectId)
            .single();
          if (project?.status === 'completed' && project.user_id === userId) {
            await supabase.from('projects').update({ status: 'active' }).eq('id', projectId);
          }
        }
      }

      await supabase.from('activity_logs').insert({
        user_id: userId,
        action: 'UPDATE_TASK_STATUS',
        entity_type: 'task',
        entity_id: id,
        description: `Updated task "${updatedTask.title}" status to: ${status}`,
      });

      return NextResponse.json({
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        priority: updatedTask.priority,
        projectId: updatedTask.project_id,
        projectTitle: projectTitle(updatedTask.projects),
        userId: updatedTask.user_id,
        isDeleted: updatedTask.is_deleted,
        createdAt: updatedTask.created_at,
        updatedAt: updatedTask.updated_at,
      });
    }

    return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (error) {
    console.error('Patch task error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;
    const { id } = await params;
    const supabase = createServiceClient();
    const denied = await assertTaskOwner(supabase, id, userId);
    if (denied) return denied;

    const { searchParams } = new URL(req.url);
    const permanent = searchParams.get('permanent') === 'true';

    const { data: task } = await supabase.from('tasks').select('title').eq('id', id).single();

    if (permanent) {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from('tasks').update({ is_deleted: true }).eq('id', id);
      if (error) throw new Error(error.message);
    }

    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: permanent ? 'DELETE_TASK_PERMANENT' : 'DELETE_TASK',
      entity_type: 'task',
      entity_id: id,
      description: `${permanent ? 'Permanently deleted' : 'Archived'} task: ${task?.title || id}`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
