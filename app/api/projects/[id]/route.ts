import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, requireUserId } from '@/lib/route-auth';

type ClientJoin = { name?: string } | null;

function clientName(clients: unknown): string {
  if (!clients || typeof clients !== 'object') return 'Unknown';
  return (clients as ClientJoin)?.name || 'Unknown';
}

async function assertProjectOwner(
  supabase: ReturnType<typeof createServiceClient>,
  id: string,
  userId: string
) {
  const { data, error } = await supabase.from('projects').select('user_id').eq('id', id).single();
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
    const denied = await assertProjectOwner(supabase, id, userId);
    if (denied) return denied;

    const { data, error } = await supabase
      .from('projects')
      .select(
        `
        id,
        title,
        description,
        status,
        client_id,
        user_id,
        is_deleted,
        created_at,
        updated_at,
        clients ( id, name, company )
      `
      )
      .eq('id', id)
      .single();
    if (error || !data) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json({
      id: data.id,
      title: data.title,
      description: data.description,
      status: data.status,
      clientId: data.client_id,
      clientName: clientName(data.clients),
      userId: data.user_id,
      isDeleted: data.is_deleted,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (error) {
    console.error('Fetch project error:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;
    const { id } = await params;
    const supabase = createServiceClient();
    const denied = await assertProjectOwner(supabase, id, userId);
    if (denied) return denied;

    const body = await req.json();
    const { title, description, status, clientId } = body;
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    const updateData: Record<string, unknown> = { title, description: description || null };
    if (status) updateData.status = status;
    if (clientId) updateData.client_id = clientId;

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select(
        `
        id,
        title,
        description,
        status,
        client_id,
        user_id,
        is_deleted,
        created_at,
        updated_at,
        clients ( id, name )
      `
      )
      .single();
    if (error) throw new Error(error.message);

    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'UPDATE_PROJECT',
      entity_type: 'project',
      entity_id: id,
      description: `Updated project: ${title}`,
    });

    return NextResponse.json({
      id: data.id,
      title: data.title,
      description: data.description,
      status: data.status,
      clientId: data.client_id,
      clientName: clientName(data.clients),
      userId: data.user_id,
      isDeleted: data.is_deleted,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;
    const { id } = await params;
    const supabase = createServiceClient();
    const denied = await assertProjectOwner(supabase, id, userId);
    if (denied) return denied;

    const body = await req.json();
    const { status, restore } = body;

    if (restore) {
      const { data, error } = await supabase
        .from('projects')
        .update({ is_deleted: false })
        .eq('id', id)
        .select(
          `
          id,
          title,
          description,
          status,
          client_id,
          user_id,
          is_deleted,
          created_at,
          updated_at,
          clients ( id, name )
        `
        )
        .single();
      if (error) throw new Error(error.message);

      await supabase.from('activity_logs').insert({
        user_id: userId,
        action: 'RESTORE_PROJECT',
        entity_type: 'project',
        entity_id: id,
        description: `Restored project: ${data.title}`,
      });

      return NextResponse.json({
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.status,
        clientId: data.client_id,
        clientName: clientName(data.clients),
        userId: data.user_id,
        isDeleted: data.is_deleted,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      });
    }

    if (status) {
      const { data, error } = await supabase
        .from('projects')
        .update({ status })
        .eq('id', id)
        .select(
          `
          id,
          title,
          description,
          status,
          client_id,
          user_id,
          is_deleted,
          created_at,
          updated_at,
          clients ( id, name )
        `
        )
        .single();
      if (error) throw new Error(error.message);

      await supabase.from('activity_logs').insert({
        user_id: userId,
        action: 'UPDATE_PROJECT_STATUS',
        entity_type: 'project',
        entity_id: id,
        description: `Updated project status to: ${status}`,
      });

      return NextResponse.json({
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.status,
        clientId: data.client_id,
        clientName: clientName(data.clients),
        userId: data.user_id,
        isDeleted: data.is_deleted,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      });
    }

    return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (error) {
    console.error('Patch project error:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;
    const { id } = await params;
    const supabase = createServiceClient();
    const denied = await assertProjectOwner(supabase, id, userId);
    if (denied) return denied;

    const { searchParams } = new URL(req.url);
    const permanent = searchParams.get('permanent') === 'true';

    const { data: project } = await supabase.from('projects').select('title').eq('id', id).single();

    if (permanent) {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from('projects').update({ is_deleted: true }).eq('id', id);
      if (error) throw new Error(error.message);
    }

    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: permanent ? 'DELETE_PROJECT_PERMANENT' : 'DELETE_PROJECT',
      entity_type: 'project',
      entity_id: id,
      description: `${permanent ? 'Permanently deleted' : 'Archived'} project: ${project?.title || id}`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
