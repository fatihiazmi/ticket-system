import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '../lib/supabase.ts';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface AuthActions {
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
  reset: () => void;
}

interface AuthStore extends AuthState, AuthActions {}

const initialState: AuthState = {
  user: null,
  isLoading: false, // Start with false, let AuthInitializer set it to true
  isInitialized: false,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    set => ({
      ...initialState,

      setUser: user => {
        set({
          user,
          isLoading: false,
          error: null,
          isInitialized: true,
        });
      },

      setLoading: isLoading => {
        set({ isLoading });
      },

      setInitialized: isInitialized => {
        set({ isInitialized });
      },

      setError: error => {
        set({
          error,
          isLoading: false,
          isInitialized: true,
        });
      },

      clearAuth: () => {
        set({
          user: null,
          isLoading: false,
          error: null,
          isInitialized: true,
        });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'auth-store',
      partialize: state => ({
        user: state.user,
        isInitialized: state.isInitialized,
      }),
    }
  )
);

// Computed selectors
export const useIsAuthenticated = () => {
  const { user, isInitialized } = useAuthStore();
  return isInitialized && !!user;
};

export const useAuthLoading = () => {
  const { isLoading, isInitialized } = useAuthStore();
  return isLoading || !isInitialized;
};
