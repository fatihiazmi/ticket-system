import React from 'react';
import { useAuthSync } from '../hooks/useAuthSync';
import { useAuthStore } from '../stores/authStore';
import { AppLoadingSkeleton } from '../components/ui/AppLoadingSkeleton';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { isLoading, error } = useAuthSync();
  const { isInitialized } = useAuthStore();

  // Show loading skeleton only during initial auth check, not during sign-out
  if (isLoading && !isInitialized) {
    return <AppLoadingSkeleton variant='dashboard' />;
  }

  if (error) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100'>
        <div className='mx-4 w-full max-w-md'>
          <div className='rounded-lg bg-white p-6 text-center shadow-lg'>
            <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100'>
              <svg
                className='h-6 w-6 text-red-600'
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
            <h2 className='mb-2 text-lg font-semibold text-gray-900'>Authentication Error</h2>
            <p className='mb-4 text-sm text-gray-600'>
              {error instanceof Error ? error.message : String(error)}
            </p>
            <button
              onClick={() => window.location.reload()}
              className='inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
