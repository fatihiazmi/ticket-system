import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * Required role(s) to access this route
   * If array is provided, user must have one of the roles
   */
  requiredRole?:
    | 'developer'
    | 'qa'
    | 'product_manager'
    | Array<'developer' | 'qa' | 'product_manager'>;
  /**
   * Redirect path when user is not authenticated
   * @default '/login'
   */
  redirectTo?: string;
}

/**
 * Protected route component that requires authentication
 * Optionally checks for specific user roles
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  redirectTo = '/login',
}) => {
  const { user, error } = useAuthStore();
  const location = useLocation();

  // If there's an authentication error, show it
  if (error) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='w-full max-w-md rounded-lg bg-white p-6 shadow-lg'>
          <div className='text-center'>
            <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100'>
              <svg
                className='h-6 w-6 text-yellow-600'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
            </div>

            <h2 className='mt-4 text-lg font-medium text-gray-900'>Authentication Issue</h2>

            <p className='mt-2 text-sm text-gray-600'>{error}</p>

            <div className='mt-6 flex flex-col space-y-3'>
              <button
                onClick={() => window.location.reload()}
                className='inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              >
                Retry
              </button>

              <button
                onClick={() => (window.location.href = '/login')}
                className='inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  // Check role-based access if required
  if (requiredRole) {
    const userRole = user.role;
    const hasRequiredRole = Array.isArray(requiredRole)
      ? requiredRole.includes(userRole)
      : userRole === requiredRole;

    if (!hasRequiredRole) {
      // User is authenticated but doesn't have required role
      return (
        <div className='flex h-screen items-center justify-center'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold text-gray-900'>Access Denied</h1>
            <p className='mt-2 text-sm text-gray-600'>
              You don't have permission to access this page.
            </p>
            <p className='mt-1 text-xs text-gray-500'>
              Required role:{' '}
              {Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole}
            </p>
            <p className='mt-1 text-xs text-gray-500'>Your role: {userRole}</p>
            <button
              onClick={() => window.history.back()}
              className='mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700'
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  // User is authenticated and has required role (if any)
  return <>{children}</>;
};

/**
 * HOC version of ProtectedRoute for wrapping components
 */
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) => {
  const WrappedComponent: React.FC<P> = props => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );

  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

/**
 * Hook to check if user has specific role(s)
 */
export const useRoleCheck = (
  requiredRole?:
    | 'developer'
    | 'qa'
    | 'product_manager'
    | Array<'developer' | 'qa' | 'product_manager'>
) => {
  const { user } = useAuthStore();

  if (!user || !requiredRole) {
    return { hasRole: true, userRole: user?.role || null };
  }

  const userRole = user.role;
  const hasRole = Array.isArray(requiredRole)
    ? requiredRole.includes(userRole)
    : userRole === requiredRole;

  return { hasRole, userRole };
};

/**
 * Component for role-based conditional rendering
 */
export interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole:
    | 'developer'
    | 'qa'
    | 'product_manager'
    | Array<'developer' | 'qa' | 'product_manager'>;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  requiredRole,
  fallback = null,
}) => {
  const { hasRole } = useRoleCheck(requiredRole);

  return hasRole ? <>{children}</> : <>{fallback}</>;
};

export default ProtectedRoute;
