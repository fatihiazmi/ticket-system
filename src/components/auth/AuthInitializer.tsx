import React, { useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

interface AuthInitializerProps {
  children: React.ReactNode;
}

export const AuthInitializer: React.FC<AuthInitializerProps> = ({ children }) => {
  const { setUser, setLoading, isLoading, setInitialized } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      setLoading(true);

      try {
        // Get initial session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (error) {
          console.error('Error getting session:', error);
          setUser(null);
          setInitialized(true);
          setLoading(false);
          return;
        }

        if (session?.user) {
          // Fetch user profile
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!isMounted) return;

          if (profileError) {
            console.error('Error fetching profile:', profileError);
            setUser(null);
          } else {
            setUser(profile);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setInitialized(true);
          setLoading(false);
        }
      }
    };

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile on sign in:', profileError);
          setUser(null);
        } else {
          setUser(profile);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, setLoading, setInitialized]);

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100'>
        <div className='text-center'>
          <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary'></div>
          <p className='text-muted-foreground'>Initializing authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
