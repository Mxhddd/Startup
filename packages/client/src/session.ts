// Who is logged in, kept up to date as Supabase refreshes or ends the session.
import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { backend } from './backend';

export function useSession(): { ready: boolean; session: Session | null; configured: boolean } {
  const [state, setState] = useState<{ ready: boolean; session: Session | null }>({ ready: !backend, session: null });
  useEffect(() => {
    if (!backend) return;
    const { supabase } = backend;
    // If the saved session can't be read, open the app logged out rather than waiting forever.
    supabase.auth
      .getSession()
      .then(({ data }) => setState({ ready: true, session: data.session }))
      .catch(() => setState({ ready: true, session: null }));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setState({ ready: true, session }));
    return () => data.subscription.unsubscribe();
  }, []);
  return { ...state, configured: !!backend };
}
