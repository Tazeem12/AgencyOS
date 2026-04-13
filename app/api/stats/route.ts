import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, requireUserId } from '@/lib/route-auth';
import { buildDashboardStats } from '@/lib/server/services/dashboard-stats.service';

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;

    const supabase = createServiceClient();
    const stats = await buildDashboardStats(supabase, userId);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Fetch stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
