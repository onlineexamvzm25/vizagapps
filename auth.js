/* STOREOFGAMES - phone-number username + password authentication.
   Phone number is converted to a private synthetic email identifier internally.
   No phone provider, OTP, SMS, or phone ownership verification is used.
   Passwords are verified and stored only by Supabase Auth.
*/
(function () {
  'use strict';

  const SUPABASE_URL = 'https://zabwuvdtqclhbuiocdey.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_0SYVgwKNDR5odypGsN1mFA_0NFbn299';

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('Supabase SDK was not loaded. Check the Supabase CDN script.');
    return;
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  // Keep compatibility with the existing project JavaScript, which uses `supabase`.
  window.storeSupabase = client;
  window.supabase = client;

  function normalizePhone(value) {
    let phone = String(value || '').trim().replace(/[\s()-]/g, '');
    if (phone.startsWith('+91')) phone = phone.slice(3);
    else if (phone.startsWith('91') && phone.length === 12) phone = phone.slice(2);

    if (!/^[6-9]\d{9}$/.test(phone)) {
      throw new Error('Enter a valid 10-digit Indian mobile number.');
    }
    return phone;
  }

  // Private, non-deliverable identifier. Users never see or type this value.
  // The same mapping is used by the one-time migration script and login page.
  function loginIdentifier(value) {
    return normalizePhone(value) + '@storeofgames.invalid';
  }

  function isLoginPage() {
    const path = window.location.pathname;
    return /(^|\/)(index|register)\.html$/i.test(path) || path.endsWith('/');
  }

  async function getDisplayName(user) {
    if (!user) return 'User';
    try {
      const { data, error } = await client
        .from('store_user_profiles')
        .select('uname, phone')
        .eq('uid', user.id)
        .maybeSingle();

      if (!error && data) return data.uname || data.phone || 'User';
    } catch (error) {
      console.warn('Could not load store user profile:', error);
    }
    return (user.user_metadata && user.user_metadata.uname) || 'User';
  }

  window.STORE_AUTH = {
    client,
    normalizePhone,
    loginIdentifier,

    async signIn(phone, password) {
      const email = loginIdentifier(phone);
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password: String(password || '')
      });
      if (error) throw error;

      const displayName = await getDisplayName(data.user);
      localStorage.setItem('store_username', displayName);
      localStorage.setItem('store_phone', normalizePhone(phone));
      return data;
    },

    async getSession() {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      return data.session;
    },

    async requireSession() {
      const session = await this.getSession();
      if (!session) {
        localStorage.removeItem('store_username');
        localStorage.removeItem('store_phone');
        window.location.replace('index.html');
        return null;
      }

      const displayName = await getDisplayName(session.user);
      localStorage.setItem('store_username', displayName);
      const phone = session.user.user_metadata && session.user.user_metadata.phone;
      if (phone) localStorage.setItem('store_phone', phone);
      return session;
    },

    async signOut() {
      const { error } = await client.auth.signOut();
      if (error) throw error;
      localStorage.removeItem('store_username');
      localStorage.removeItem('store_phone');
      window.location.replace('index.html');
    },

    async updatePassword(newPassword) {
      const { data, error } = await client.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return data;
    }
  };

  document.addEventListener('DOMContentLoaded', async function () {
    try {
      const session = await window.STORE_AUTH.getSession();
      if (isLoginPage()) {
        if (session) window.location.replace('homepage.html');
      } else if (!session) {
        localStorage.removeItem('store_username');
        localStorage.removeItem('store_phone');
        window.location.replace('index.html');
      } else {
        localStorage.setItem('store_username', await getDisplayName(session.user));
        const phone = session.user.user_metadata && session.user.user_metadata.phone;
        if (phone) localStorage.setItem('store_phone', phone);
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      if (!isLoginPage()) window.location.replace('index.html');
    }
  });
})();
