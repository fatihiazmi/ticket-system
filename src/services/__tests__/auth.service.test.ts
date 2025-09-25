import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the entire supabase module
vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      onAuthStateChange: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

import { authService } from '../auth.service.js';
import { supabase } from '../../lib/supabase.js';

// Type the mocked supabase
const mockSupabase = supabase as any;

describe('AuthService', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('signUp', () => {
    it('should sign up a new user successfully', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: 'developer' as const,
      };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            user_metadata: {},
          },
          session: null,
        },
        error: null,
      });

      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: 'profile-123',
          full_name: 'Test User',
          role: 'developer',
          user_id: 'user-123',
        },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
        select: vi.fn(),
      });

      // Act
      const result = await authService.signUp(userData);

      // Assert
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
      expect(result.data?.full_name).toBe('Test User');
      expect(result.data?.role).toBe('developer');
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'Test User',
            role: 'developer',
          },
        },
      });
    });

    it('should handle auth signup error', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: 'developer' as const,
      };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already exists' },
      });

      // Act
      const result = await authService.signUp(userData);

      // Assert
      expect(result.data).toBeNull();
      expect(result.error?.message).toBe('User already exists');
    });
  });

  describe('signIn', () => {
    it('should sign in user successfully', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
          },
          session: {
            access_token: 'token123',
          },
        },
        error: null,
      });

      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: 'profile-123',
          full_name: 'Test User',
          role: 'developer',
        },
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      mockSupabase.from.mockReturnValue({
        insert: vi.fn(),
        select: mockSelect,
      });

      // Act
      const result = await authService.signIn(credentials);

      // Assert
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
      expect(result.data?.full_name).toBe('Test User');
      expect(result.data?.role).toBe('developer');
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should handle invalid credentials', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      // Act
      const result = await authService.signIn(credentials);

      // Assert
      expect(result.data).toBeNull();
      expect(result.error?.message).toBe('Invalid login credentials');
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      // Arrange
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      // Act
      const result = await authService.signOut();

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it('should handle sign out error', async () => {
      // Arrange
      const authError = { message: 'Session expired' };
      mockSupabase.auth.signOut.mockResolvedValue({ error: authError });

      // Act
      const result = await authService.signOut();

      // Assert
      expect(result.data).toBeNull();
      expect(result.error?.message).toBe('Session expired');
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user successfully', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: 'profile-123',
          full_name: 'Test User',
          role: 'developer',
        },
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      mockSupabase.from.mockReturnValue({
        insert: vi.fn(),
        select: mockSelect,
      });

      // Act
      const result = await authService.getCurrentUser();

      // Assert
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
      expect(result.data?.full_name).toBe('Test User');
      expect(result.data?.role).toBe('developer');
    });

    it('should handle no authenticated user', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // Act
      const result = await authService.getCurrentUser();

      // Assert
      expect(result.data).toBeNull();
      expect(result.error?.message).toBe('No authenticated user');
    });
  });

  describe('resetPassword', () => {
    it('should send reset password email successfully', async () => {
      // Arrange
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });

      // Act
      const result = await authService.resetPassword({ email: 'test@example.com' });

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
        redirectTo: `${window.location.origin}/reset-password`,
      });
    });

    it('should handle reset password error', async () => {
      // Arrange
      const authError = { message: 'Email not found' };
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: authError });

      // Act
      const result = await authService.resetPassword({ email: 'test@example.com' });

      // Assert
      expect(result.data).toBeNull();
      expect(result.error?.message).toBe('Email not found');
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      // Arrange
      mockSupabase.auth.updateUser.mockResolvedValue({ error: null });

      // Act
      const result = await authService.updatePassword({ password: 'newpassword123' });

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      });
    });

    it('should handle password update error', async () => {
      // Arrange
      const authError = { message: 'Password too weak' };
      mockSupabase.auth.updateUser.mockResolvedValue({ error: authError });

      // Act
      const result = await authService.updatePassword({ password: 'weak' });

      // Assert
      expect(result.data).toBeNull();
      expect(result.error?.message).toBe('Password too weak');
    });
  });
});
