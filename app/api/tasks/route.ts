import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, requireUserId } from '@/lib/route-auth';
import { ilikeContainsPattern } from '@/lib/like-pattern';

type ProjectsJoin = {
  title?: string;
  clients?: { name?: string } | null;
} | null;

function formatTaskRow(task: Record<string, unknown>) {
  const p = task.projects as ProjectsJoin;
  const clients = p?.clients && typeof p.clients === 'object' ? p.clients : null;
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    projectId: task.project_id,
    projectTitle: p?.title || 'Unknown',
    clientName: (clients as { name?: string })?.name || 'Unknown',
    userId: task.user_id,
    isDeleted: task.is_deleted,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
  };
}

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;

    const supabase = createServiceClient();
    const { searchParams } = new URL(req.url);
    const includeDeleted = searchParams.get('includeDeleted') === 'true';
    const projectId = searchParams.get('projectId') || '';
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const search = (searchParams.get('search') || '').trim();

    let query = supabase
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
        projects (
          id,
          title,
          client_id,
          clients ( id, name )
        )
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!includeDeleted) {
      query = query.eq('is_deleted', false);
    }
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }
    if (search) {
      query = query.ilike('title', ilikeContainsPattern(search));
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const formattedData = (data || []).map((task) => formatTaskRow(task as Record<string, unknown>));
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Fetch tasks error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;

    const supabase = createServiceClient();
    const body = await req.json();
    const { title, description, projectId, priority } = body;
    if (!title || !projectId) {
      return NextResponse.json({ error: 'Title and project are required' }, { status: 400 });
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, title, status, user_id')
      .eq('id', projectId)
      .eq('is_deleted', false)
      .single();
    if (projectError || !project || project.user_id !== userId) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.status === 'planning') {
      await supabase.from('projects').update({ status: 'active' }).eq('id', projectId);
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          title,
          description: description || null,
          status: 'todo',
          priority: priority || 'medium',
          project_id: projectId,
          user_id: userId,
          is_deleted: false,
        },
      ])
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
        updated_at
      `
      )
      .single();

    if (error) throw new Error(error.message);

    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'CREATE_TASK',
      entity_type: 'task',
      entity_id: data.id,
      description: `Created task: ${title} in project: ${project.title}`,
    });

    return NextResponse.json(
      {
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        projectId: data.project_id,
        projectTitle: project.title,
        userId: data.user_id,
        isDeleted: data.is_deleted,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
