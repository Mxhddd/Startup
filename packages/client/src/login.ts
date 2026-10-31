// What the login screen needs from Supabase: send a code, check it, save the person's name.
// Parents also get their family made on first login (ensure_family, in the database).
import { backend } from './backend';

class NotConfigured extends Error {
  kind = 'notConfigured' as const;
}

function need() {
  if (!backend) throw new NotConfigured('notConfigured');
  return backend;
}

export function loginActions(role: 'parent' | 'driver', lang: 'ur' | 'en') {
  return {
    sendCode: async (phone: string) => {
      const { error } = await need().supabase.auth.signInWithOtp({ phone, options: { channel: 'sms' } });
      if (error) throw error;
    },
    verify: async (phone: string, code: string) => {
      const { supabase } = need();
      const { data, error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' });
      if (error) throw error;
      const uid = data.user?.id;
      if (!uid) throw new Error('no user');
      const { data: profile, error: readError } = await supabase.from('profiles').select('id').eq('id', uid).maybeSingle();
      if (readError) throw readError;
      return { needsName: !profile };
    },
    saveName: async (name: string) => {
      const { supabase } = need();
      const uid = (await supabase.auth.getUser()).data.user?.id;
      if (!uid) throw new Error('no user');
      const { error } = await supabase.from('profiles').insert({ id: uid, display_name: name, lang });
      if (error) throw error;
      if (role === 'parent') {
        const { error: famError } = await supabase.rpc('ensure_family');
        if (famError) throw famError;
      }
    },
  };
}
