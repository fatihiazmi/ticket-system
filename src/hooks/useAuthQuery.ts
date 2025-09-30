import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.ts';
import { useAuthStore } from '../stores/authStore.ts';

interface SignInCredentials {
  email: string;
  password: string;
}

interface SignUpCredentials {
  email: string;
  password: string;
  fullName: string;
  role: 'developer' | 'qa' | 'product_manager';
}

// Sign in mutation
export const useSignIn = () => {
  const queryClient = useQueryClient();
  const { setError } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: SignInCredentials) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ['auth', 'current-user'] });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });
};

// Sign up mutation
export const useSignUp = () => {
  const queryClient = useQueryClient();
  const { setError } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: SignUpCredentials) => {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.fullName,
            role: credentials.role,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'current-user'] });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });
};

// Sign out mutation
export const useSignOut = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      // Clear auth state immediately for instant UI feedback
      clearAuth();

      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      // Clear all auth-related queries
      queryClient.removeQueries({ queryKey: ['auth'] });
      queryClient.clear(); // Clear entire query cache

      // Navigate to login using React Router
      navigate('/login', { replace: true });
    },
    onError: (error: Error) => {
      console.error('Sign out error:', error);
      // Even on error, try to clear local state and redirect
      clearAuth();
      navigate('/login', { replace: true });
    },
  });
};
