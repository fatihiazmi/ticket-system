import React, { Component } from 'react';
import type { ReactNode } from 'react';
import { Button } from '../ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Auth Error Boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    // Force a page reload to reinitialize auth
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className='flex min-h-screen items-center justify-center bg-gray-50'>
          <div className='w-full max-w-md rounded-lg bg-white p-6 shadow-lg'>
            <div className='text-center'>
              <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100'>
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

              <h2 className='mt-4 text-lg font-medium text-gray-900'>Authentication Error</h2>

              <p className='mt-2 text-sm text-gray-600'>
                Something went wrong with the authentication system. This might be due to a network
                issue or session expiry.
              </p>

              {this.state.error && (
                <p className='mt-2 rounded bg-gray-100 p-2 font-mono text-xs text-gray-500'>
                  {this.state.error.message}
                </p>
              )}

              <div className='mt-6 flex flex-col space-y-3'>
                <Button onClick={this.handleRetry} className='w-full'>
                  Retry
                </Button>

                <Button
                  variant='secondary'
                  onClick={() => (window.location.href = '/login')}
                  className='w-full'
                >
                  Go to Login
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;
