import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { AuthUser, UserProfile } from '../types';
import { formatPhoneNumber } from '../utils/validation';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser({
          id: session.user.id,
          email: '',
          user_metadata: session.user.user_metadata,
        });

        const { data } = await supabase
          .from('users_profile')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (data) setProfile(data);
      }
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: '',
            user_metadata: session.user.user_metadata,
          });
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const signUp = useCallback(
    async (username: string, password: string, phone: string) => {
      try {
        const formattedPhone = formatPhoneNumber(phone);
        const email = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@gamestoreapp.local`;

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          const { error: profileError } = await supabase
            .from('users_profile')
            .insert({
              user_id: data.user.id,
              username: username,
              phone_number: formattedPhone,
              is_admin: false,
            });

          if (profileError) throw profileError;
        }

        return { success: true, data };
      } catch (error) {
        return { success: false, error };
      }
    },
    []
  );

  const signIn = useCallback(
    async (usernameOrPhone: string, password: string) => {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('users_profile')
          .select('user_id, username')
          .or(`username.eq.${usernameOrPhone},phone_number.eq.${usernameOrPhone}`)
          .maybeSingle();

        if (profileError || !profileData) {
          throw new Error('Username atau nomor WhatsApp tidak ditemukan');
        }

        const email = `${profileData.username.toLowerCase().replace(/[^a-z0-9]/g, '')}@gamestoreapp.local`;

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw new Error('Username/Phone atau password salah');

        return { success: true, data };
      } catch (error) {
        return { success: false, error };
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
      return { success: true };
    } catch (error) {
      return { success: false, error };
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
