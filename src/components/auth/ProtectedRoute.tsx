import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

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
  /**
   * Show loading spinner while checking authentication
   * @default true
   */
  showLoading?: boolean;
}

/**
 * Loading component displayed while authentication state is being determined
 */
const LoadingSpinner: React.FC = () => (
  <div className='flex h-screen items-center justify-center'>
    <div className='flex flex-col items-center space-y-4'>
      <div className='h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent'></div>
      <p className='text-sm text-gray-600'>Loading...</p>
    </div>
  </div>
);

/**
 * Protected route component that requires authentication
 * Optionally checks for specific user roles
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  redirectTo = '/login',
  showLoading = true,
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading spinner while determining auth state
  if (loading) {
    return showLoading ? <LoadingSpinner /> : null;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
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
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user || !requiredRole) {
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
