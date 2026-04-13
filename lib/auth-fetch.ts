import { getSupabaseBrowser } from '@/lib/supabase';

export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const supabase = getSupabaseBrowser();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers = new Headers(init?.headers);
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }
  return fetch(input, { ...init, headers });
}
