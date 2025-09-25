import { useState, useEffect, useCallback } from 'react';
import {
  authService,
  type SignUpCredentials,
  type SignInCredentials,
  type AuthResponse,
} from '../services/auth.service.ts';
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

  // Initialize auth state on mount
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: user, error } = await authService.getCurrentUser();

        if (mounted) {
          setState(prev => ({
            ...prev,
            user: error ? null : user,
            loading: false,
            error: error?.message || null,
          }));
        }
      } catch (error) {
        if (mounted) {
          setState(prev => ({
            ...prev,
            user: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize auth',
          }));
        }
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const {
      data: { subscription },
    } = authService.onAuthStateChange(user => {
      if (mounted) {
        setState(prev => ({
          ...prev,
          user,
          loading: false,
          error: null,
        }));
      }
    });

    // Cleanup
    return () => {
      mounted = false;
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
      const { data: user, error } = await authService.getCurrentUser();

      setState(prev => ({
        ...prev,
        user: error ? null : user,
        loading: false,
        error: error?.message || null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to refresh user',
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
  };
};

export default useAuth;
