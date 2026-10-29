import { supabase } from './client';

// `name` is null until the person finishes creating their account.
export type Session = { email: string; name: string | null };

const nameOf = (metadata: Record<string, unknown>) => {
  const name = metadata.name;
  return typeof name === 'string' && name.trim() ? name : null;
};

// Reports the stored session as soon as it is restored, then on every sign-in, update, and sign-out.
export function subscribeSession(onChange: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    onChange(session && { email: session.user.email ?? '', name: nameOf(session.user.user_metadata) });
  });
  return () => data.subscription.unsubscribe();
}
