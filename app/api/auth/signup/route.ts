import { NextResponse } from 'next/server';

/** Signup is handled directly by Supabase passwordless OTP in the client. */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Signup is handled directly by Supabase OTP and this endpoint is not used.',
    },
    { status: 400 }
  );
}
