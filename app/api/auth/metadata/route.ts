import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event, metadata } = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const token = authHeader.slice(7);

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Log to activity_logs table
    const { error: insertError } = await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: event,
      entity_type: 'user',
      entity_id: user.id,
      description: `User logged in via ${metadata?.method || 'unknown'}`,
      metadata,
    });

    if (insertError) {
      console.error('Failed to store auth metadata:', insertError);
      return NextResponse.json({ error: 'Failed to store auth metadata' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Auth metadata route error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
