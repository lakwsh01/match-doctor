import { useState } from 'react';
import type { AuthFailure } from '../../lib/auth/actions';

// Runs one auth action and keeps its pending state and failure for the step to show.
export function useSubmit<T = void>(action: (input: T) => Promise<AuthFailure | null>, onDone?: () => void) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<AuthFailure | null>(null);

  const run = async (input: T) => {
    setPending(true);
    setError(null);
    const failure = await action(input);
    setError(failure);
    setPending(false);
    if (!failure) onDone?.();
  };

  return { pending, error, run };
}
