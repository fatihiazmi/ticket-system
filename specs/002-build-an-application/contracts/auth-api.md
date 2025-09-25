# API Contracts: Authentication

**Service**: User Authentication & Authorization  
**Provider**: Supabase Auth  
**Base URL**: Supabase instance URL

## Authentication Flow

### Sign Up
```typescript
interface SignUpRequest {
  email: string;
  password: string;
  full_name: string;
  role: 'developer' | 'qa' | 'product_manager';
}

interface SignUpResponse {
  user: User;
  session: Session;
  message: string;
}
```

### Sign In
```typescript
interface SignInRequest {
  email: string;
  password: string;
}

interface SignInResponse {
  user: User;
  session: Session;
}
```

### Profile Management
```typescript
interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'developer' | 'qa' | 'product_manager';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// GET /api/auth/profile
interface GetProfileResponse {
  profile: UserProfile;
}

// PATCH /api/auth/profile  
interface UpdateProfileRequest {
  full_name?: string;
  avatar_url?: string;
  role?: 'developer' | 'qa' | 'product_manager';
}
```

## Role-based Permissions

### Developer Role
- Can approve/reject `dev_review` status
- Can transition own assigned issues to `dev_review`
- Can create and comment on all issues
- Can assign issues to any user

### QA Role  
- Can approve/reject `qa_review` status
- Can create and comment on all issues
- Can assign issues to any user
- Cannot approve `dev_review` status

### Product Manager Role
- Can approve/reject `pm_review` status (final approval)
- Can create and comment on all issues
- Can assign issues to any user
- Cannot approve `dev_review` or `qa_review` status

### Universal Permissions (All Authenticated Users)
- Create new issues
- Comment on issues
- Assign issues to team members
- Transition issues to `in_progress`
- Reopen `resolved` issues
- View all non-internal comments

## JWT Token Structure
```typescript
interface JWTPayload {
  sub: string; // user ID
  email: string;
  role: string; // supabase role, not app role
  app_metadata: {
    provider: string;
  };
  user_metadata: {
    full_name: string;
    app_role: 'developer' | 'qa' | 'product_manager';
  };
  aud: string;
  exp: number;
  iat: number;
}
```

## Error Codes
```typescript
interface AuthError {
  code: string;
  message: string;
}

// Common error codes:
// "invalid_credentials" - Wrong email/password
// "email_not_confirmed" - User hasn't confirmed email
// "signup_disabled" - Registration disabled
// "invalid_token" - JWT token invalid/expired
// "insufficient_permissions" - Role-based access denied
```