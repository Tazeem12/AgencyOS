import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, requireUserId } from '@/lib/route-auth';

async function assertClientOwner(supabase: ReturnType<typeof createServiceClient>, id: string, userId: string) {
  const { data, error } = await supabase.from('clients').select('user_id').eq('id', id).single();
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
    const notOk = await assertClientOwner(supabase, id, userId);
    if (notOk) return notOk;

    const { data, error } = await supabase.from('clients').select('*').eq('id', id).single();
    if (error || !data) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json({
      id: data.id,
      name: data.name,
      company: data.company,
      email: data.email,
      phone: data.phone,
      userId: data.user_id,
      isDeleted: data.is_deleted,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (error) {
    console.error('Fetch client error:', error);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;
    const { id } = await params;
    const supabase = createServiceClient();
    const notOk = await assertClientOwner(supabase, id, userId);
    if (notOk) return notOk;

    const body = await req.json();
    const { name, company, email, phone } = body;
    if (!name || !company || !email) {
      return NextResponse.json({ error: 'Name, company, and email are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('clients')
      .update({ name, company, email, phone: phone || null })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'UPDATE_CLIENT',
      entity_type: 'client',
      entity_id: id,
      description: `Updated client: ${name}`,
    });

    return NextResponse.json({
      id: data.id,
      name: data.name,
      company: data.company,
      email: data.email,
      phone: data.phone,
      userId: data.user_id,
      isDeleted: data.is_deleted,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (error) {
    console.error('Update client error:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;
    const { id } = await params;
    const supabase = createServiceClient();
    const notOk = await assertClientOwner(supabase, id, userId);
    if (notOk) return notOk;

    const { searchParams } = new URL(req.url);
    const permanent = searchParams.get('permanent') === 'true';

    const { data: client } = await supabase.from('clients').select('name').eq('id', id).single();

    if (permanent) {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from('clients').update({ is_deleted: true }).eq('id', id);
      if (error) throw new Error(error.message);
    }

    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: permanent ? 'DELETE_CLIENT_PERMANENT' : 'DELETE_CLIENT',
      entity_type: 'client',
      entity_id: id,
      description: `${permanent ? 'Permanently deleted' : 'Archived'} client: ${client?.name || id}`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete client error:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;
    const { id } = await params;
    const supabase = createServiceClient();
    const notOk = await assertClientOwner(supabase, id, userId);
    if (notOk) return notOk;

    const body = await req.json();
    const { restore } = body;
    if (restore) {
      const { data, error } = await supabase
        .from('clients')
        .update({ is_deleted: false })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);

      await supabase.from('activity_logs').insert({
        user_id: userId,
        action: 'RESTORE_CLIENT',
        entity_type: 'client',
        entity_id: id,
        description: `Restored client: ${data.name}`,
      });

      return NextResponse.json({
        id: data.id,
        name: data.name,
        company: data.company,
        email: data.email,
        phone: data.phone,
        userId: data.user_id,
        isDeleted: data.is_deleted,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      });
    }
    return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (error) {
    console.error('Patch client error:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}
