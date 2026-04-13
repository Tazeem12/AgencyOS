import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, requireUserId } from '@/lib/route-auth';
import { ilikeContainsPattern, postgrestQuotedValue } from '@/lib/like-pattern';

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;

    const supabase = createServiceClient();
    const { searchParams } = new URL(req.url);
    const includeDeleted = searchParams.get('includeDeleted') === 'true';
    const search = (searchParams.get('search') || '').trim();

    let query = supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!includeDeleted) {
      query = query.eq('is_deleted', false);
    }
    if (search) {
      const pattern = postgrestQuotedValue(ilikeContainsPattern(search));
      query = query.or(`name.ilike.${pattern},company.ilike.${pattern},email.ilike.${pattern}`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const formattedData = (data || []).map((client) => ({
      id: client.id,
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      userId: client.user_id,
      isDeleted: client.is_deleted,
      createdAt: client.created_at,
      updatedAt: client.updated_at,
    }));
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Fetch clients error:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;

    const supabase = createServiceClient();
    const body = await req.json();
    const { name, company, email, phone } = body;
    if (!name || !company || !email) {
      return NextResponse.json({ error: 'Name, company, and email are required' }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('clients')
      .insert([
        {
          name,
          company,
          email,
          phone: phone || null,
          user_id: userId,
          is_deleted: false,
        },
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);

    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'CREATE_CLIENT',
      entity_type: 'client',
      entity_id: data.id,
      description: `Created client: ${name}`,
    });

    return NextResponse.json(
      {
        id: data.id,
        name: data.name,
        company: data.company,
        email: data.email,
        phone: data.phone,
        userId: data.user_id,
        isDeleted: data.is_deleted,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create client error:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
