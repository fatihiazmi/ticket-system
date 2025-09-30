import { useState, useEffect, useCallback } from 'react';
import {
  authService,
  type SignUpCredentials,
  type SignInCredentials,
  type AuthResponse,
} from '../services/auth.service.ts';
import { supabase } from '../lib/supabase.ts';
import type { AuthUser } from '../lib/supabase.ts';

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

export interface AuthActions {
  signIn: (credentials: SignInCredentials) => Promise<AuthResponse>;
  signUp: (credentials: SignUpCredentials) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResponse<void>>;
  updatePassword: (password: string) => Promise<AuthResponse<void>>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  refreshSession: () => Promise<void>;
  retryAuth: () => Promise<void>;
}

export interface UseAuthReturn extends AuthState, AuthActions {
  isAuthenticated: boolean;
}

/**
 * Custom hook for managing authentication state and actions
 */
export const useAuth = (): UseAuthReturn => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Initialize auth state following Supabase recommended pattern - single useEffect
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    let isInitializing = true;

    // Safety timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('Auth initialization timeout - setting loading to false');
        setState(prev => ({
          ...prev,
          loading: false,
          error: prev.error || 'Authentication initialization timed out',
        }));
      }
    }, 15000); // 15 second safety timeout

    // Fetch user profile helper function
    const fetchUserProfile = async (userId: string, source: string = 'unknown') => {
      try {
        console.log(`Fetching profile for user: ${userId} (source: ${source})`);
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();

        console.log('Profile fetch result:', {
          hasProfile: !!profileData,
          error: profileError?.message,
          userId: userId,
          source,
        });

        if (mounted) {
          clearTimeout(timeoutId);
          if (profileError) {
            console.warn('Profile not found, but user is authenticated. Setting loading to false.');
            // Profile doesn't exist, but user is authenticated
            // This is common for new users who haven't completed profile setup
            setState(prev => ({
              ...prev,
              user: null,
              loading: false,
              error: 'User profile not found. Please complete your profile setup.',
            }));
          } else {
            // Profile found successfully
            setState(prev => ({
              ...prev,
              user: profileData,
              loading: false,
              error: null,
            }));
          }
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
        if (mounted) {
          clearTimeout(timeoutId);
          setState(prev => ({
            ...prev,
            user: null,
            loading: false,
            error: 'Failed to fetch user profile',
          }));
        }
      }
    };

    // Fetch the session once, and subscribe to auth state changes
    const fetchSession = async () => {
      try {
        console.log('Fetching initial session...');
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Error fetching session:', error);
          if (mounted) {
            clearTimeout(timeoutId);
            setState(prev => ({
              ...prev,
              user: null,
              loading: false,
              error: error.message,
            }));
          }
          return;
        }

        console.log('Initial session result:', { hasSession: !!session, hasUser: !!session?.user });

        if (mounted) {
          if (session?.user) {
            console.log('Session found, fetching profile for user:', session.user.id);
            // User is authenticated, fetch their profile
            setState(prev => ({ ...prev, loading: true }));
            await fetchUserProfile(session.user.id, 'initial-session');
          } else {
            console.log('No session found, setting user to null');
            clearTimeout(timeoutId);
            // No session, user is not authenticated
            setState(prev => ({
              ...prev,
              user: null,
              loading: false,
              error: null,
            }));
          }
        }

        // Mark initialization as complete
        isInitializing = false;
      } catch (error) {
        console.error('Session fetch error:', error);
        if (mounted) {
          clearTimeout(timeoutId);
          setState(prev => ({
            ...prev,
            user: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch session',
          }));
        }
        isInitializing = false;
      }
    };

    // Initial session fetch
    fetchSession();

    // Set up auth state change listener - single listener for all auth events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', { event, session: !!session, isInitializing });

      if (!mounted || isInitializing) return;

      // Clear timeout on any auth state change
      clearTimeout(timeoutId);

      // Handle different auth events
      if (event === 'SIGNED_OUT' || !session) {
        setState(prev => ({
          ...prev,
          user: null,
          loading: false,
          error: null,
        }));
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setState(prev => ({ ...prev, loading: true }));
          await fetchUserProfile(session.user.id, `auth-event-${event}`);
        }
      }
    });

    // Cleanup
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  // Sign in function
  const signIn = useCallback(async (credentials: SignInCredentials): Promise<AuthResponse> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await authService.signIn(credentials);

      setState(prev => ({
        ...prev,
        user: response.data,
        loading: false,
        error: response.error?.message || null,
      }));

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      setState(prev => ({
        ...prev,
        user: null,
        loading: false,
        error: errorMessage,
      }));

      return { data: null, error: { message: errorMessage } };
    }
  }, []);

  // Sign up function
  const signUp = useCallback(async (credentials: SignUpCredentials): Promise<AuthResponse> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await authService.signUp(credentials);

      setState(prev => ({
        ...prev,
        user: response.data,
        loading: false,
        error: response.error?.message || null,
      }));

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      setState(prev => ({
        ...prev,
        user: null,
        loading: false,
        error: errorMessage,
      }));

      return { data: null, error: { message: errorMessage } };
    }
  }, []);

  // Sign out function
  const signOut = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await authService.signOut();

      setState(prev => ({
        ...prev,
        user: null,
        loading: false,
        error: response.error?.message || null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Sign out failed',
      }));
    }
  }, []);

  // Reset password function
  const resetPassword = useCallback(async (email: string): Promise<AuthResponse<void>> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await authService.resetPassword({ email });

      setState(prev => ({
        ...prev,
        loading: false,
        error: response.error?.message || null,
      }));

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      return { data: null, error: { message: errorMessage } };
    }
  }, []);

  // Update password function
  const updatePassword = useCallback(async (password: string): Promise<AuthResponse<void>> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await authService.updatePassword({ password });

      setState(prev => ({
        ...prev,
        loading: false,
        error: response.error?.message || null,
      }));

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password update failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      return { data: null, error: { message: errorMessage } };
    }
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Refresh user function
  const refreshUser = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setState(prev => ({
          ...prev,
          user: profileError ? null : profileData,
          loading: false,
          error: profileError?.message || null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          user: null,
          loading: false,
          error: 'No authenticated user',
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to refresh user',
      }));
    }
  }, []);

  // Refresh session function
  const refreshSession = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error || !data.session) {
        setState(prev => ({
          ...prev,
          user: null,
          loading: false,
          error: 'Session expired - please log in again',
        }));
        return;
      }

      // Refresh user data after successful session refresh
      await refreshUser();
    } catch (error) {
      setState(prev => ({
        ...prev,
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to refresh session',
      }));
    }
  }, [refreshUser]);

  // Retry authentication function
  const retryAuth = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        setState(prev => ({
          ...prev,
          user: null,
          loading: false,
          error: error.message,
        }));
        return;
      }

      if (session?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setState(prev => ({
          ...prev,
          user: profileError ? null : profileData,
          loading: false,
          error: profileError?.message || null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          user: null,
          loading: false,
          error: null,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to retry authentication',
      }));
    }
  }, []);

  return {
    // State
    user: state.user,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user && !state.loading,

    // Actions
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    clearError,
    refreshUser,
    refreshSession,
    retryAuth,
  };
};

export default useAuth;
