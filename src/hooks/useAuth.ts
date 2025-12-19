import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { AuthUser, UserProfile } from '../types';
import { formatPhoneNumber } from '../utils/validation';

// Constants for localStorage caching
const PROFILE_CACHE_KEY = 'thisizstore_profile_cache';
const PROFILE_CACHE_EXPIRY_KEY = 'thisizstore_profile_cache_expiry';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// Helper functions for profile caching
const getCachedProfile = (): UserProfile | null => {
  try {
    const expiry = localStorage.getItem(PROFILE_CACHE_EXPIRY_KEY);
    if (expiry && Date.now() > parseInt(expiry, 10)) {
      // Cache expired
      localStorage.removeItem(PROFILE_CACHE_KEY);
      localStorage.removeItem(PROFILE_CACHE_EXPIRY_KEY);
      return null;
    }
    const cached = localStorage.getItem(PROFILE_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

const setCachedProfile = (profile: UserProfile) => {
  try {
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
    localStorage.setItem(PROFILE_CACHE_EXPIRY_KEY, String(Date.now() + CACHE_DURATION_MS));
  } catch (e) {
    console.warn('[useAuth] Failed to cache profile:', e);
  }
};

const clearCachedProfile = () => {
  try {
    localStorage.removeItem(PROFILE_CACHE_KEY);
    localStorage.removeItem(PROFILE_CACHE_EXPIRY_KEY);
  } catch {
    // Ignore errors
  }
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  // IMPORTANT: Initialize profile from cache immediately to prevent flash of non-admin state
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const cached = getCachedProfile();
    if (cached) {
      console.log('[useAuth] Initial profile from cache:', cached.username, 'is_admin:', cached.is_admin);
    }
    return cached;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted) {
          console.log('[useAuth] Session found:', session.user.id);
          setUser({
            id: session.user.id,
            email: '',
            user_metadata: session.user.user_metadata,
          });

          // IMMEDIATELY load cached profile to prevent flash of non-admin state
          const cachedProfile = getCachedProfile();
          if (cachedProfile && cachedProfile.user_id === session.user.id) {
            console.log('[useAuth] Using cached profile:', cachedProfile.username, 'is_admin:', cachedProfile.is_admin);
            setProfile(cachedProfile);
          }

          // Load fresh profile from database with retry logic
          let retries = 3;
          let profileData = null;

          while (retries > 0 && !profileData) {
            try {
              const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Profile load timeout')), 15000)
              );

              const profilePromise = supabase
                .from('users_profile')
                .select('*')
                .eq('user_id', session.user.id)
                .maybeSingle();

              const result = await Promise.race([profilePromise, timeoutPromise]) as Awaited<typeof profilePromise>;

              if (result.data) {
                profileData = result.data;
              } else if (result.error) {
                console.warn('[useAuth] Profile load attempt failed:', result.error);
              }
            } catch (err) {
              console.warn('[useAuth] Profile load attempt error:', err);
            }

            if (!profileData && retries > 1) {
              await new Promise(r => setTimeout(r, 1000)); // Wait 1s before retry
            }
            retries--;
          }

          if (profileData && mounted) {
            console.log('[useAuth] Profile loaded from DB:', profileData.username, 'is_admin:', profileData.is_admin);
            setProfile(profileData);
            setCachedProfile(profileData); // Update cache with fresh data
          } else if (!cachedProfile) {
            console.warn('[useAuth] Failed to load profile after retries and no cache available');
          }
        } else if (mounted) {
          // No session - clear any cached profile
          clearCachedProfile();
        }
        if (mounted) setLoading(false);
      } catch (error) {
        console.error('[useAuth] Error in getSession:', error);
        if (mounted) setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        console.log('[useAuth] Auth state changed, event:', _event);

        if (session?.user) {
          console.log('[useAuth] User authenticated:', session.user.id);
          setUser({
            id: session.user.id,
            email: '',
            user_metadata: session.user.user_metadata,
          });

          // Load profile ketika auth state berubah dengan timeout
          try {
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Profile load timeout')), 30000)
            );

            const profilePromise = supabase
              .from('users_profile')
              .select('*')
              .eq('user_id', session.user.id)
              .maybeSingle();

            const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as Awaited<typeof profilePromise>;

            if (mounted) {
              if (error) {
                console.warn('[useAuth] Profile load error:', error);
                // Don't clear profile on error - keep existing profile if available
              } else if (data) {
                console.log('[useAuth] Profile updated from auth state change:', data.username, 'is_admin:', data.is_admin);
                setProfile(data);
                setCachedProfile(data); // Update cache
              } else {
                console.log('[useAuth] No profile found');
                setProfile(null);
                clearCachedProfile();
              }
            }
          } catch (error) {
            console.error('[useAuth] Profile load error (timeout?):', error);
            // DON'T clear profile on timeout - keep existing profile to maintain admin access
            // This prevents admin from losing access during slow network
            console.log('[useAuth] Keeping existing profile due to error');
          }
        } else {
          console.log('[useAuth] User logged out');
          setUser(null);
          setProfile(null);
          clearCachedProfile();
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = useCallback(
    async (username: string, password: string, phone: string) => {
      try {
        const formattedPhone = formatPhoneNumber(phone);
        // Normalize username to lowercase for consistent login
        const normalizedUsername = username.toLowerCase().trim();
        const email = `${normalizedUsername.replace(/[^a-z0-9]/g, '')}@gamestoreapp.local`;

        console.log('[signUp] Creating user with normalized username:', normalizedUsername);

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          console.error('SignUp auth error:', error);
          throw error;
        }

        if (data.user) {
          const { error: profileError } = await supabase
            .from('users_profile')
            .insert({
              user_id: data.user.id,
              username: normalizedUsername, // Store as lowercase
              phone_number: formattedPhone,
              is_admin: false,
            });

          if (profileError) {
            console.error('SignUp profile error:', profileError);
            throw profileError;
          }
        }

        return { success: true, data };
      } catch (error: any) {
        console.error('SignUp error:', error);
        return { success: false, error };
      }
    },
    []
  );

  const signIn = useCallback(
    async (usernameOrPhone: string, password: string) => {
      try {
        console.log('[signIn] Starting login with:', usernameOrPhone);

        const input = usernameOrPhone.trim();
        const isPhone = /^[0-9+\-\s()]+$/.test(input);

        let email: string;

        if (isPhone) {
          // Untuk login dengan nomor telepon, gunakan RPC function yang bypass RLS
          console.log('[signIn] Phone login - using RPC function');
          const formattedPhone = formatPhoneNumber(input);
          console.log('[signIn] Formatted phone:', formattedPhone);

          // Panggil RPC function untuk mendapatkan username dari nomor telepon
          const { data: username, error: rpcError } = await supabase
            .rpc('get_username_by_phone', { phone_input: formattedPhone });

          if (rpcError) {
            console.error('[signIn] RPC error:', rpcError);
            // Fallback: coba login dengan username jika RPC belum disetup
            throw new Error('Login dengan nomor telepon belum tersedia. Silakan login dengan username.');
          }

          if (!username) {
            throw new Error('Nomor WhatsApp tidak ditemukan');
          }

          console.log('[signIn] RPC returned username:', username);
          email = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@gamestoreapp.local`;
        } else {
          // Untuk login dengan username - LANGSUNG derive email tanpa query!
          const normalizedUsername = input.toLowerCase().trim();
          email = `${normalizedUsername.replace(/[^a-z0-9]/g, '')}@gamestoreapp.local`;
          console.log('[signIn] Username login - derived email directly:', email);
        }

        // Login dengan email dan password
        console.log('[signIn] Attempting Supabase auth with email:', email);
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          console.error('[signIn] Auth error:', authError);
          if (authError.message.includes('Invalid login credentials')) {
            throw new Error('Username atau password salah');
          }
          throw new Error('Login gagal: ' + authError.message);
        }

        console.log('[signIn] Login successful, user:', authData.user?.id);

        // SELALU load profile fresh setelah auth berhasil untuk mendapatkan is_admin terbaru
        if (authData.user) {
          const { data: profileData, error: profileError } = await supabase
            .from('users_profile')
            .select('*')
            .eq('user_id', authData.user.id)
            .maybeSingle();

          if (profileError) {
            console.error('[signIn] Profile load error:', profileError);
          }

          console.log('[signIn] Loaded profile after auth:', profileData?.username, 'is_admin:', profileData?.is_admin);

          setUser({
            id: authData.user.id,
            email: '',
            user_metadata: authData.user.user_metadata,
          });
          setProfile(profileData);
        }

        return { success: true, data: authData };
      } catch (error: any) {
        console.error('[signIn] Error:', error.message || error);
        return { success: false, error };
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
      setUser(null);
      setProfile(null);
      clearCachedProfile(); // Clear cached profile on logout
      return { success: true };
    } catch (error) {
      console.error('SignOut error:', error);
      // Force logout bahkan jika ada error
      setUser(null);
      setProfile(null);
      clearCachedProfile(); // Clear cached profile on logout
      return { success: true };
    }
  }, []);

  return {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    isAdmin: profile?.is_admin || false,
  };
}