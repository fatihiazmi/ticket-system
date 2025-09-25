import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { motion } from 'framer-motion';
import { useAuthContext } from '../contexts/AuthContext.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Input } from '../components/ui/Input.tsx';
import { Label } from '../components/ui/Label.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/Card.tsx';
import AuthLayout from '../components/layout/AuthLayout.tsx';

const LoginPage: React.FC = () => {
  const { user, signIn } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  if (user) {
    return <Navigate to='/dashboard' replace />;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn({ email, password });
      if (result.error) {
        setError(result.error.message);
      }
      // Navigation will happen automatically via context
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout maxWidth='md'>
      <div className='relative'>
        {/* Background decoration */}
        <div className='absolute inset-0 -m-2 rounded-2xl bg-gradient-to-br from-blue-50/50 to-purple-50/50 blur-sm' />

        <Card className='relative overflow-hidden rounded-2xl border-0 bg-white/95 shadow-2xl backdrop-blur-xl'>
          {/* Enhanced Header */}
          <CardHeader className='bg-gradient-to-br from-slate-50/50 to-blue-50/30 pb-8 pt-10 text-center'>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <CardTitle className='mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent'>
                Welcome Back
              </CardTitle>
              <CardDescription className='text-lg font-medium text-slate-600'>
                Sign in to your account to continue
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className='px-10 pb-10'>
            <form onSubmit={handleSubmit} className='space-y-8'>
              {/* Enhanced Form Fields */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className='space-y-6'
              >
                <div className='space-y-3'>
                  <Label
                    htmlFor='email'
                    className='flex items-center gap-2 text-sm font-semibold text-slate-700'
                  >
                    <div className='h-1.5 w-1.5 rounded-full bg-blue-500' />
                    Email Address
                  </Label>
                  <Input
                    id='email'
                    type='email'
                    placeholder='Enter your email'
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className='h-12 rounded-xl border-2 border-slate-200 bg-white/70 px-4 text-slate-800 backdrop-blur-sm transition-all duration-300 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/20'
                  />
                </div>

                <div className='space-y-3'>
                  <Label
                    htmlFor='password'
                    className='flex items-center gap-2 text-sm font-semibold text-slate-700'
                  >
                    <div className='h-1.5 w-1.5 rounded-full bg-purple-500' />
                    Password
                  </Label>
                  <Input
                    id='password'
                    type='password'
                    placeholder='Enter your password'
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className='h-12 rounded-xl border-2 border-slate-200 bg-white/70 px-4 text-slate-800 backdrop-blur-sm transition-all duration-300 placeholder:text-slate-400 hover:border-slate-300 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-500/20'
                  />
                </div>
              </motion.div>

              {/* Enhanced Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className='flex items-start gap-3 rounded-xl border border-red-200/70 bg-gradient-to-r from-red-50 to-pink-50 p-4 backdrop-blur-sm'
                >
                  <ExclamationTriangleIcon className='mt-0.5 h-5 w-5 flex-shrink-0 text-red-600' />
                  <span className='text-sm font-medium text-red-700'>{error}</span>
                </motion.div>
              )}

              {/* Enhanced Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Button
                  type='submit'
                  disabled={isLoading}
                  className={`h-14 w-full transform rounded-xl text-base font-semibold transition-all duration-300 ${
                    isLoading
                      ? 'cursor-not-allowed bg-slate-300 text-slate-500'
                      : 'border-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 text-white shadow-xl shadow-blue-500/25 hover:scale-[1.02] hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 hover:shadow-2xl hover:shadow-blue-500/40 active:scale-[0.98]'
                  }`}
                >
                  {isLoading ? (
                    <div className='flex items-center justify-center gap-3'>
                      <div className='h-5 w-5 animate-spin rounded-full border-2 border-slate-400/30 border-t-slate-500' />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <span className='flex items-center justify-center gap-2'>
                      Sign In
                      <div className='h-0 w-0 border-y-2 border-l-4 border-y-transparent border-l-white/80 transition-transform duration-200 group-hover:translate-x-1' />
                    </span>
                  )}
                </Button>
              </motion.div>
            </form>
          </CardContent>

          {/* Enhanced Footer */}
          <CardFooter className='px-10 pb-10 pt-0'>
            <div className='w-full space-y-6'>
              <div className='relative'>
                <div className='absolute inset-0 flex items-center'>
                  <div className='h-px w-full bg-gradient-to-r from-transparent via-slate-300/50 to-transparent' />
                </div>
                <div className='relative flex justify-center'>
                  <span className='bg-white px-4 text-xs font-medium uppercase tracking-wider text-slate-400'>
                    New here?
                  </span>
                </div>
              </div>

              <div className='text-center'>
                <Link
                  to='/signup'
                  className='inline-flex items-center gap-2 font-semibold text-slate-600 decoration-blue-500/30 decoration-2 underline-offset-4 transition-all duration-200 hover:text-blue-600 hover:underline'
                >
                  <span>Create your account</span>
                  <div className='border-l-3 h-0 w-0 border-y-2 border-y-transparent border-l-current transition-transform duration-200 hover:translate-x-0.5' />
                </Link>
              </div>

              {/* Demo Accounts Section */}
              <div className='mt-8 rounded-xl border border-slate-200/50 bg-gradient-to-br from-slate-50/50 to-blue-50/30 p-4'>
                <h3 className='mb-3 text-center text-sm font-semibold text-slate-700'>
                  Demo Accounts
                </h3>
                <div className='space-y-2 text-xs'>
                  <div className='flex items-center justify-between py-1'>
                    <span className='font-medium text-slate-600'>SuperAdmin:</span>
                    <span className='rounded bg-white/60 px-2 py-0.5 font-mono text-slate-700'>
                      admin@demo.com : password
                    </span>
                  </div>
                  <div className='flex items-center justify-between py-1'>
                    <span className='font-medium text-slate-600'>Developer:</span>
                    <span className='rounded bg-white/60 px-2 py-0.5 font-mono text-slate-700'>
                      john@demo.com : password
                    </span>
                  </div>
                  <div className='flex items-center justify-between py-1'>
                    <span className='font-medium text-slate-600'>QA:</span>
                    <span className='rounded bg-white/60 px-2 py-0.5 font-mono text-slate-700'>
                      sarah@demo.com : password
                    </span>
                  </div>
                  <div className='flex items-center justify-between py-1'>
                    <span className='font-medium text-slate-600'>Manager:</span>
                    <span className='rounded bg-white/60 px-2 py-0.5 font-mono text-slate-700'>
                      mike@demo.com : password
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
