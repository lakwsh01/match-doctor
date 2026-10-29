import { useEffect, useState } from 'react';
import { subscribeSession } from '../lib/auth/session';
import type { Session } from '../lib/auth/session';

// undefined while the stored session is restored, null when signed out.
export function useSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => subscribeSession(setSession), []);
  return session;
}
