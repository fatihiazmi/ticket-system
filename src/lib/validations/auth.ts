/**
 * Authentication and User Management Validation Schemas
 *
 * Zod schemas for validating authentication requests,
 * user profiles, and role-based data.
 */

import { z } from 'zod';

// User role validation
export const userRoleSchema = z.enum(['developer', 'qa', 'product_manager', 'superadmin'], {
  errorMap: () => ({ message: 'Role must be developer, qa, product_manager, or superadmin' }),
});

// User profile validation schemas
export const createUserProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters')
    .regex(
      /^[a-zA-Z\s\-']+$/,
      'Full name can only contain letters, spaces, hyphens, and apostrophes'
    ),
  role: userRoleSchema,
  avatarUrl: z.string().url('Avatar URL must be a valid URL').optional().or(z.literal('')),
});

export const updateUserProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters')
    .regex(
      /^[a-zA-Z\s\-']+$/,
      'Full name can only contain letters, spaces, hyphens, and apostrophes'
    )
    .optional(),
  role: userRoleSchema.optional(),
  avatarUrl: z.string().url('Avatar URL must be a valid URL').optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

// Authentication validation schemas
export const signUpSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(255, 'Email must not exceed 255 characters')
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters')
    .regex(
      /^[a-zA-Z\s\-']+$/,
      'Full name can only contain letters, spaces, hyphens, and apostrophes'
    ),
  role: userRoleSchema,
});

export const signInSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(255, 'Email must not exceed 255 characters')
    .toLowerCase(),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Password must not exceed 128 characters'),
});

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(255, 'Email must not exceed 255 characters')
    .toLowerCase(),
});

export const updatePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required')
      .max(128, 'Password must not exceed 128 characters'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(128, 'New password must not exceed 128 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
  })
  .refine(data => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

// UUID validation helper
export const uuidSchema = z.string().uuid('Invalid UUID format');

// User profile response validation
export const userProfileResponseSchema = z.object({
  id: uuidSchema,
  fullName: z.string(),
  avatarUrl: z.string().url().optional(),
  role: userRoleSchema,
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Auth user response validation
export const authUserResponseSchema = z.object({
  id: uuidSchema,
  email: z.string().email(),
  emailConfirmed: z.boolean(),
  lastSignInAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  profile: userProfileResponseSchema,
});

// Auth session response validation
export const authSessionResponseSchema = z.object({
  user: authUserResponseSchema,
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresAt: z.number().positive(),
});

// Type exports for use in components
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;
export type CreateUserProfileFormData = z.infer<typeof createUserProfileSchema>;
export type UpdateUserProfileFormData = z.infer<typeof updateUserProfileSchema>;

// Validation helper functions
export const validateUserRole = (role: unknown): role is 'developer' | 'qa' | 'product_manager' => {
  return userRoleSchema.safeParse(role).success;
};

export const validateEmail = (email: string): boolean => {
  return z.string().email().safeParse(email).success;
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const result = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
    .safeParse(password);

  if (result.success) {
    return { isValid: true, errors: [] };
  }

  return {
    isValid: false,
    errors: result.error.errors.map(err => err.message),
  };
};
