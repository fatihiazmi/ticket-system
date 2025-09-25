import { supabase } from '../lib/supabase.js';
import type { AuthError, AuthUser } from '../lib/supabase.js';

export interface SignUpCredentials {
  email: string;
  password: string;
  fullName: string;
  role: 'developer' | 'qa' | 'product_manager';
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface ResetPasswordCredentials {
  email: string;
}

export interface UpdatePasswordCredentials {
  password: string;
}

export interface AuthResponse<T = AuthUser> {
  data: T | null;
  error: AuthError | null;
}

class AuthService {
  /**
   * Sign up a new user with email and password
   */
  async signUp(credentials: SignUpCredentials): Promise<AuthResponse> {
    try {
      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.fullName,
            role: credentials.role,
          },
        },
      });

      if (authError) {
        return { data: null, error: { message: authError.message } };
      }

      if (!authData.user) {
        return { data: null, error: { message: 'Failed to create user' } };
      }

      // Create user profile in our database
      // Note: This requires the user_profiles table to exist in Supabase
      const { data: profileData, error: profileError } = await (supabase as any)
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          full_name: credentials.fullName,
          role: credentials.role,
          is_active: true,
        })
        .select()
        .single();

      if (profileError) {
        // If profile creation fails, we should cleanup the auth user (in a real app)
        return { data: null, error: { message: 'Failed to create user profile' } };
      }

      return { data: profileData, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error occurred' },
      };
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(credentials: SignInCredentials): Promise<AuthResponse> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) {
        return { data: null, error: { message: authError.message } };
      }

      // TypeScript knows authData.user exists at this point

      // Fetch the user profile
      const { data: profileData, error: profileError } = await (supabase as any)
        .from('user_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        return { data: null, error: { message: 'Failed to fetch user profile' } };
      }

      return { data: profileData, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error occurred' },
      };
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<AuthResponse<void>> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { data: null, error: { message: error.message } };
      }

      return { data: null, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error occurred' },
      };
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AuthResponse> {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        return { data: null, error: { message: authError.message } };
      }

      if (!user) {
        return { data: null, error: { message: 'No authenticated user' } };
      }

      // Fetch the user profile
      const { data: profileData, error: profileError } = await (supabase as any)
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        return { data: null, error: { message: 'Failed to fetch user profile' } };
      }

      return { data: profileData, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error occurred' },
      };
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(credentials: ResetPasswordCredentials): Promise<AuthResponse<void>> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(credentials.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { data: null, error: { message: error.message } };
      }

      return { data: null, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error occurred' },
      };
    }
  }

  /**
   * Update user password
   */
  async updatePassword(credentials: UpdatePasswordCredentials): Promise<AuthResponse<void>> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: credentials.password,
      });

      if (error) {
        return { data: null, error: { message: error.message } };
      }

      return { data: null, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error occurred' },
      };
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Fetch user profile when user signs in
        const { data: profileData, error } = await (supabase as any)
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!error && profileData) {
          callback(profileData);
        } else {
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      return !error && !!user;
    } catch {
      return false;
    }
  }

  /**
   * Get current session
   */
  async getSession() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    return { session, error };
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
