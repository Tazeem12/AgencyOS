import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, requireUserId } from '@/lib/route-auth';

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;

    const supabase = createServiceClient();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const entityType = searchParams.get('entityType') || '';

    let query = supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const formattedData = (data || []).map((log) => ({
      id: log.id,
      userId: log.user_id,
      action: log.action,
      entityType: log.entity_type,
      entityId: log.entity_id,
      description: log.description,
      metadata: log.metadata,
      createdAt: log.created_at,
    }));
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Fetch activity logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await req.json();
    const { action, email, userId } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    // For OTP-related actions, we may not have userId yet
    const insertData = {
      user_id: userId,
      action,
      entity_type: 'auth',
      description: `Authentication action: ${action}`,
      metadata: {
        email: email ? email.toLowerCase() : null,
        timestamp: new Date().toISOString(),
      },
    };

    const { error } = await supabase.from('activity_logs').insert(insertData);

    if (error) {
      console.error('Activity log error:', error);
      // Silently fail for logging - don't break the flow
      return NextResponse.json({ success: false }, { status: 200 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Activity logging error:', error);
    // Silently fail for logging
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
