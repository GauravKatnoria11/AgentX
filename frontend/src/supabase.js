import { createClient } from '@supabase/supabase-js';
import { oauthCallback, setAuthToken } from './api';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sample-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const SUPABASE_CALLBACK_URL = 'https://zvfysitimzyvwrnjwtbx.supabase.co/auth/v1/callback';

export const isLiveSupabase = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('sample-project') &&
  !supabaseUrl.includes('your-project')
);

export const supabase = isLiveSupabase
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

/**
 * Sign In with Google OAuth via Supabase
 */
export const signInWithGoogle = async () => {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });

  if (error) throw error;
  return data;
};

/**
 * Sign In with Facebook OAuth via Supabase
 */
export const signInWithFacebook = async () => {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo: window.location.origin
    }
  });

  if (error) throw error;
  return data;
};

/**
 * Sign in with Email & Password via Supabase Auth
 */
export const signInWithEmail = async (email, password) => {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
};

/**
 * Sign up with Email & Password via Supabase Auth
 */
export const signUpWithEmail = async (email, password, metadata = {}) => {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  });

  if (error) throw error;
  return data;
};

/**
 * Listen for OAuth redirect tokens returned in URL hash (from Supabase redirect)
 */
export const initOAuthRedirectListener = async (onUserLoaded) => {
  if (isLiveSupabase && supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const u = session.user;
        const provider = u.app_metadata?.provider || 'google';
        const res = await oauthCallback({
          provider: provider === 'facebook' ? 'facebook' : 'google',
          access_token: session.access_token,
          email: u.email,
          full_name: u.user_metadata?.full_name || u.user_metadata?.name || u.email.split('@')[0],
          avatar_url: u.user_metadata?.avatar_url || u.user_metadata?.picture
        });
        if (res.success && res.data?.user && onUserLoaded) {
          onUserLoaded(res.data.user);
        }
      }
    } catch (e) {
      console.warn('OAuth session check error:', e);
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        const u = session.user;
        const provider = u.app_metadata?.provider || 'google';
        const res = await oauthCallback({
          provider: provider === 'facebook' ? 'facebook' : 'google',
          access_token: session.access_token,
          email: u.email,
          full_name: u.user_metadata?.full_name || u.user_metadata?.name || u.email.split('@')[0],
          avatar_url: u.user_metadata?.avatar_url || u.user_metadata?.picture
        });
        if (res.success && res.data?.user && onUserLoaded) {
          onUserLoaded(res.data.user);
        }
      }
    });
  }
};
