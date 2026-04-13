import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, requireUserId } from '@/lib/route-auth';
import { ilikeContainsPattern } from '@/lib/like-pattern';

type ClientJoin = { name?: string; company?: string } | null;

function formatClientJoin(clients: unknown): ClientJoin {
  if (!clients || typeof clients !== 'object') return null;
  return clients as ClientJoin;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;

    const supabase = createServiceClient();
    const { searchParams } = new URL(req.url);
    const includeDeleted = searchParams.get('includeDeleted') === 'true';
    const search = (searchParams.get('search') || '').trim();
    const status = searchParams.get('status') || '';
    const clientId = searchParams.get('clientId') || '';

    let query = supabase
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
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!includeDeleted) {
      query = query.eq('is_deleted', false);
    }
    if (search) {
      query = query.ilike('title', ilikeContainsPattern(search));
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const formattedData = (data || []).map((project: Record<string, unknown>) => {
      const c = formatClientJoin(project.clients);
      return {
        id: project.id,
        title: project.title,
        description: project.description,
        status: project.status,
        clientId: project.client_id,
        clientName: c?.name || 'Unknown',
        clientCompany: c?.company || '',
        userId: project.user_id,
        isDeleted: project.is_deleted,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      };
    });
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Fetch projects error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;

    const supabase = createServiceClient();
    const body = await req.json();
    const { title, description, clientId, status } = body;
    if (!title || !clientId) {
      return NextResponse.json({ error: 'Title and client are required' }, { status: 400 });
    }

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name, user_id')
      .eq('id', clientId)
      .eq('is_deleted', false)
      .single();
    if (clientError || !client || client.user_id !== userId) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          title,
          description: description || null,
          status: status || 'planning',
          client_id: clientId,
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
        client_id,
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
      action: 'CREATE_PROJECT',
      entity_type: 'project',
      entity_id: data.id,
      description: `Created project: ${title} for client: ${client.name}`,
    });

    return NextResponse.json(
      {
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.status,
        clientId: data.client_id,
        clientName: client.name,
        userId: data.user_id,
        isDeleted: data.is_deleted,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
