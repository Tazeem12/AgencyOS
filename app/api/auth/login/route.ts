import { NextResponse } from 'next/server';

/** Login is handled directly by Supabase passwordless OTP in the client. */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Login is handled directly by Supabase OTP and this endpoint is not used.',
    },
    { status: 400 }
  );
}
