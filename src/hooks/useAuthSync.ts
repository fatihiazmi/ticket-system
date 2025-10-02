import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import type { AuthUser } from '../lib/supabase';

// Fetch current user and session
const fetchCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw new Error(sessionError.message);
    }

    if (!session?.user) {
      return null;
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      throw new Error(`Failed to fetch user profile: ${profileError.message}`);
    }

    return profile;
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error;
  }
};

// Hook that syncs React Query auth data with Zustand store
export const useAuthSync = () => {
  const { setUser, setLoading, setError, setInitialized } = useAuthStore();

  // React Query for auth data
  const {
    data: user,
    isLoading,
    error,
    isSuccess,
    isError,
  } = useQuery({
    queryKey: ['auth', 'current-user'],
    queryFn: fetchCurrentUser,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error?.message?.includes('JWTExpired') || error?.message?.includes('unauthorized')) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  // Sync React Query state to Zustand store
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  useEffect(() => {
    if (isSuccess) {
      setUser(user);
      setError(null);
      setInitialized(true);
    }
  }, [isSuccess, user, setUser, setError, setInitialized]);

  useEffect(() => {
    if (isError) {
      setUser(null);
      setError(error?.message || 'Authentication error');
      setInitialized(true);
    }
  }, [isError, error, setUser, setError, setInitialized]);

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async event => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setError(null);
      }
      // For SIGNED_IN, let the query refetch naturally
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setError]);

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
  };
};
