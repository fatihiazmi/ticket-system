/**
 * Authentication and User Management Types
 *
 * These types define the structure for user authentication,
 * profile management, and role-based access control.
 */

export interface User {
  id: string;
  email: string;
  emailConfirmed: boolean;
  lastSignInAt: string | null;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'developer' | 'qa' | 'product_manager' | 'superadmin';

export interface CreateUserProfileRequest {
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface UpdateUserProfileRequest {
  fullName?: string;
  avatarUrl?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface AuthUser extends User {
  profile: UserProfile;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface SignUpRequest {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AuthError {
  code: string;
  message: string;
  details?: string;
}

export interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  error: AuthError | null;
}

// Role-based permission helpers
export const ROLE_PERMISSIONS = {
  developer: {
    canCreateIssues: true,
    canEditOwnIssues: true,
    canEditAllIssues: false,
    canApproveDevReview: true,
    canApproveQAReview: false,
    canApprovePMReview: false,
    canViewInternalComments: true,
    canManageUsers: false,
  },
  qa: {
    canCreateIssues: true,
    canEditOwnIssues: true,
    canEditAllIssues: true,
    canApproveDevReview: false,
    canApproveQAReview: true,
    canApprovePMReview: false,
    canViewInternalComments: true,
    canManageUsers: false,
  },
  product_manager: {
    canCreateIssues: true,
    canEditOwnIssues: true,
    canEditAllIssues: true,
    canApproveDevReview: false,
    canApproveQAReview: false,
    canApprovePMReview: true,
    canViewInternalComments: true,
    canManageUsers: true,
  },
  superadmin: {
    canCreateIssues: true,
    canEditOwnIssues: true,
    canEditAllIssues: true,
    canApproveDevReview: true,
    canApproveQAReview: true,
    canApprovePMReview: true,
    canViewInternalComments: true,
    canManageUsers: true,
  },
} as const;

export type RolePermissions = (typeof ROLE_PERMISSIONS)[UserRole];
