import { supabase } from './supabase';

export class AuthDebugger {
  static async diagnoseSession() {
    console.group('🔍 Auth Session Diagnosis');

    try {
      // Check localStorage
      const storedSession = localStorage.getItem('ticket-system-auth-token');
      console.log('📦 Stored session exists:', !!storedSession);

      if (storedSession) {
        try {
          const parsed = JSON.parse(storedSession);
          console.log('📦 Stored session structure:', {
            hasAccessToken: !!parsed?.access_token,
            hasRefreshToken: !!parsed?.refresh_token,
            expiresAt: parsed?.expires_at
              ? new Date(parsed.expires_at * 1000).toISOString()
              : 'N/A',
            isExpired: parsed?.expires_at ? Date.now() / 1000 > parsed.expires_at : 'Unknown',
          });
        } catch (e) {
          console.warn('📦 Failed to parse stored session');
        }
      }

      // Check current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      console.log('🔐 Current session:', {
        exists: !!session,
        error: sessionError?.message || 'None',
        expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'N/A',
        userId: session?.user?.id || 'N/A',
      });

      // Check user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      console.log('👤 Current user:', {
        exists: !!user,
        error: userError?.message || 'None',
        id: user?.id || 'N/A',
        email: user?.email || 'N/A',
      });

      // Test refresh
      console.log('🔄 Testing session refresh...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      console.log('🔄 Refresh result:', {
        success: !!refreshData.session && !refreshError,
        error: refreshError?.message || 'None',
        newSession: !!refreshData.session,
      });
    } catch (error) {
      console.error('💥 Diagnosis failed:', error);
    }

    console.groupEnd();
  }

  static logAuthEvent(event: string, details?: any) {
    console.log(`🔐 Auth Event: ${event}`, details || '');
  }
}

// Add to window for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).authDebugger = AuthDebugger;
}
