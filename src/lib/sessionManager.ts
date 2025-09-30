import { supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';

export class SessionManager {
  private static instance: SessionManager;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Check if there's a stored session
   */
  hasStoredSession(): boolean {
    try {
      const storedToken = localStorage.getItem('ticket-system-auth-token');
      return !!storedToken;
    } catch {
      return false;
    }
  }

  /**
   * Get current session with automatic refresh if needed
   */
  async getValidSession(): Promise<Session | null> {
    try {
      // Get current session
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.warn('Session error:', error.message);
        return null;
      }

      if (!session) {
        console.log('No active session found');
        return null;
      }

      // Check if session is expired or about to expire (within 5 minutes)
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at || 0;
      const timeUntilExpiry = expiresAt - now;

      if (timeUntilExpiry <= 300) {
        // Less than 5 minutes
        console.log('Session expires soon, refreshing...');
        const refreshed = await this.refreshSession();
        if (refreshed) {
          // Get the new session after refresh
          const {
            data: { session: newSession },
          } = await supabase.auth.getSession();
          return newSession;
        }
        return null;
      }

      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Refresh session with deduplication
   */
  async refreshSession() {
    // If already refreshing, return the existing promise
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise.then(() => null);
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async performRefresh(): Promise<boolean> {
    try {
      console.log('Attempting to refresh session...');

      const { data, error } = await supabase.auth.refreshSession();

      if (error || !data.session) {
        console.warn('Session refresh failed:', error?.message);
        await this.clearSession();
        return false;
      }

      console.log('Session refreshed successfully');
      return true;
    } catch (error) {
      console.error('Session refresh error:', error);
      await this.clearSession();
      return false;
    }
  }

  /**
   * Clear session and local storage
   */
  async clearSession() {
    try {
      localStorage.removeItem('ticket-system-auth-token');
      // Don't call signOut here as it might cause loops
      console.log('Session cleared');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  /**
   * Initialize session monitoring
   */
  startSessionMonitoring() {
    // Check session every minute
    const interval = setInterval(async () => {
      if (this.hasStoredSession()) {
        await this.getValidSession();
      }
    }, 60000); // 1 minute

    // Clear interval on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        clearInterval(interval);
      });
    }

    return () => clearInterval(interval);
  }
}

export const sessionManager = SessionManager.getInstance();
