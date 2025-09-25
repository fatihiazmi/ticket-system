import React from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { ProtectedRoute } from '../components/auth/ProtectedRoute.js';

// Example login component
const LoginPage: React.FC = () => {
  const { signIn, loading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    await signIn({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    });
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50'>
      <div className='w-full max-w-md space-y-8'>
        <div>
          <h2 className='text-center text-3xl font-bold text-gray-900'>Sign in to your account</h2>
        </div>
        <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
          {error && (
            <div className='rounded-md bg-red-50 p-4'>
              <div className='text-sm text-red-700'>{error}</div>
            </div>
          )}
          <div>
            <input
              name='email'
              type='email'
              required
              className='w-full rounded-md border border-gray-300 px-3 py-2'
              placeholder='Email address'
            />
          </div>
          <div>
            <input
              name='password'
              type='password'
              required
              className='w-full rounded-md border border-gray-300 px-3 py-2'
              placeholder='Password'
            />
          </div>
          <button
            type='submit'
            disabled={loading}
            className='w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50'
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Example protected dashboard
const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <div className='p-8'>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Dashboard</h1>
        <div className='flex items-center space-x-4'>
          <span className='text-sm text-gray-600'>
            Welcome, {user?.full_name} ({user?.role})
          </span>
          <button
            onClick={signOut}
            className='rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700'
          >
            Sign out
          </button>
        </div>
      </div>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <div className='rounded-lg bg-white p-6 shadow'>
          <h3 className='text-lg font-medium'>Issues</h3>
          <p className='text-3xl font-bold'>24</p>
        </div>
        <div className='rounded-lg bg-white p-6 shadow'>
          <h3 className='text-lg font-medium'>In Progress</h3>
          <p className='text-3xl font-bold'>8</p>
        </div>
        <div className='rounded-lg bg-white p-6 shadow'>
          <h3 className='text-lg font-medium'>Completed</h3>
          <p className='text-3xl font-bold'>16</p>
        </div>
      </div>
    </div>
  );
};

// Example app structure with routing
const App: React.FC = () => {
  return (
    <div className='min-h-screen bg-gray-50'>
      {/* This would typically use React Router */}
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>

      {/* Role-based access example */}
      <ProtectedRoute requiredRole='product_manager'>
        <div className='p-8'>
          <h2 className='text-xl font-bold'>Product Manager Only</h2>
          <p>This content is only visible to product managers.</p>
        </div>
      </ProtectedRoute>

      {/* Multiple roles example */}
      <ProtectedRoute requiredRole={['qa', 'product_manager']}>
        <div className='p-8'>
          <h2 className='text-xl font-bold'>QA & PM Dashboard</h2>
          <p>This content is visible to QA engineers and product managers.</p>
        </div>
      </ProtectedRoute>
    </div>
  );
};

export default App;
