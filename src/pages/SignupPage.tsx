import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { motion } from 'framer-motion';
import { useAuthContext } from '../contexts/AuthContext.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Input } from '../components/ui/Input.tsx';
import { Label } from '../components/ui/Label.tsx';
import { Select } from '../components/ui/Select.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/Card.tsx';
import AuthLayout from '../components/layout/AuthLayout.tsx';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  role: 'developer' | 'qa' | 'product_manager' | '';
}

const SignupPage: React.FC = () => {
  const { user, signUp } = useAuthContext();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  if (user) {
    return <Navigate to='/dashboard' replace />;
  }

  const handleInputChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (error) setError(null);
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value as FormData['role'] }));
    if (error) setError(null);
  };

  const validateForm = (): string | null => {
    if (
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.fullName ||
      !formData.role
    ) {
      return 'All fields are required';
    }

    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters long';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Please enter a valid email address';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: formData.role as 'developer' | 'qa' | 'product_manager',
      });

      if (result.error) {
        setError(result.error.message);
      }
      // Navigation will happen automatically via context
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout maxWidth='4xl'>
      <div className='relative'>
        {/* Background decoration */}
        <div className='absolute inset-0 -m-2 rounded-2xl bg-gradient-to-br from-blue-50/50 to-purple-50/50 blur-sm' />

        <Card className='relative overflow-hidden rounded-2xl border-0 bg-white/95 shadow-2xl backdrop-blur-xl'>
          {/* Header with enhanced styling */}
          <CardHeader className='bg-gradient-to-br from-slate-50/50 to-blue-50/30 pb-8 pt-10 text-center'>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <CardTitle className='mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent'>
                Create Account
              </CardTitle>
              <CardDescription className='text-lg font-medium text-slate-600'>
                Join our platform and start managing tickets efficiently
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className='px-10 pb-10'>
            <form onSubmit={handleSubmit} className='space-y-8'>
              {/* Form Grid */}
              <div className='grid gap-8 md:grid-cols-2'>
                {/* Left Column */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className='space-y-6'
                >
                  <div className='space-y-3'>
                    <Label
                      htmlFor='fullName'
                      className='flex items-center gap-2 text-sm font-semibold text-slate-700'
                    >
                      <div className='h-1.5 w-1.5 rounded-full bg-blue-500' />
                      Full Name
                    </Label>
                    <Input
                      id='fullName'
                      type='text'
                      placeholder='Enter your full name'
                      value={formData.fullName}
                      onChange={handleInputChange('fullName')}
                      required
                      disabled={isLoading}
                      className='h-12 rounded-xl border-2 border-slate-200 bg-white/70 px-4 text-slate-800 backdrop-blur-sm transition-all duration-300 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/20'
                    />
                  </div>

                  <div className='space-y-3'>
                    <Label
                      htmlFor='email'
                      className='flex items-center gap-2 text-sm font-semibold text-slate-700'
                    >
                      <div className='h-1.5 w-1.5 rounded-full bg-purple-500' />
                      Email Address
                    </Label>
                    <Input
                      id='email'
                      type='email'
                      placeholder='Enter your email'
                      value={formData.email}
                      onChange={handleInputChange('email')}
                      required
                      disabled={isLoading}
                      className='h-12 rounded-xl border-2 border-slate-200 bg-white/70 px-4 text-slate-800 backdrop-blur-sm transition-all duration-300 placeholder:text-slate-400 hover:border-slate-300 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-500/20'
                    />
                  </div>

                  <div className='space-y-3'>
                    <Label
                      htmlFor='role'
                      className='flex items-center gap-2 text-sm font-semibold text-slate-700'
                    >
                      <div className='h-1.5 w-1.5 rounded-full bg-indigo-500' />
                      Role
                    </Label>
                    <Select
                      id='role'
                      value={formData.role}
                      onChange={e => handleRoleChange(e.target.value)}
                      disabled={isLoading}
                      className='h-12 rounded-xl border-2 border-slate-200 bg-white/70 px-4 text-slate-800 backdrop-blur-sm transition-all duration-300 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/20'
                      required
                    >
                      <option value='' className='text-slate-400'>
                        Choose your role
                      </option>
                      <option value='developer'>🧑‍💻 Developer</option>
                      <option value='qa'>🔍 QA Engineer</option>
                      <option value='product_manager'>📋 Product Manager</option>
                    </Select>
                  </div>
                </motion.div>

                {/* Right Column */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className='space-y-6'
                >
                  <div className='space-y-3'>
                    <Label
                      htmlFor='password'
                      className='flex items-center gap-2 text-sm font-semibold text-slate-700'
                    >
                      <div className='h-1.5 w-1.5 rounded-full bg-emerald-500' />
                      Password
                    </Label>
                    <Input
                      id='password'
                      type='password'
                      placeholder='Create a secure password'
                      value={formData.password}
                      onChange={handleInputChange('password')}
                      required
                      disabled={isLoading}
                      className='h-12 rounded-xl border-2 border-slate-200 bg-white/70 px-4 text-slate-800 backdrop-blur-sm transition-all duration-300 placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/20'
                    />
                  </div>

                  <div className='space-y-3'>
                    <Label
                      htmlFor='confirmPassword'
                      className='flex items-center gap-2 text-sm font-semibold text-slate-700'
                    >
                      <div className='h-1.5 w-1.5 rounded-full bg-rose-500' />
                      Confirm Password
                    </Label>
                    <Input
                      id='confirmPassword'
                      type='password'
                      placeholder='Confirm your password'
                      value={formData.confirmPassword}
                      onChange={handleInputChange('confirmPassword')}
                      required
                      disabled={isLoading}
                      className='h-12 rounded-xl border-2 border-slate-200 bg-white/70 px-4 text-slate-800 backdrop-blur-sm transition-all duration-300 placeholder:text-slate-400 hover:border-slate-300 focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/20'
                    />
                  </div>

                  {/* Enhanced Password Requirements */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className='rounded-xl border border-slate-200/70 bg-gradient-to-br from-slate-50 to-blue-50/50 p-4 backdrop-blur-sm'
                  >
                    <h4 className='mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700'>
                      <div className='h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500' />
                      Password Requirements
                    </h4>
                    <ul className='space-y-2'>
                      <motion.li
                        className={`flex items-center gap-3 text-sm transition-colors duration-200 ${
                          formData.password.length >= 6 ? 'text-emerald-700' : 'text-slate-500'
                        }`}
                        animate={{
                          scale: formData.password.length >= 6 ? [1, 1.05, 1] : 1,
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        <div
                          className={`h-3 w-3 rounded-full transition-all duration-200 ${
                            formData.password.length >= 6
                              ? 'bg-emerald-500 shadow-md shadow-emerald-500/30'
                              : 'bg-slate-300'
                          }`}
                        />
                        At least 6 characters
                      </motion.li>
                      <motion.li
                        className={`flex items-center gap-3 text-sm transition-colors duration-200 ${
                          formData.password === formData.confirmPassword &&
                          formData.password.length > 0
                            ? 'text-emerald-700'
                            : 'text-slate-500'
                        }`}
                        animate={{
                          scale:
                            formData.password === formData.confirmPassword &&
                            formData.password.length > 0
                              ? [1, 1.05, 1]
                              : 1,
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        <div
                          className={`h-3 w-3 rounded-full transition-all duration-200 ${
                            formData.password === formData.confirmPassword &&
                            formData.password.length > 0
                              ? 'bg-emerald-500 shadow-md shadow-emerald-500/30'
                              : 'bg-slate-300'
                          }`}
                        />
                        Passwords match
                      </motion.li>
                    </ul>
                  </motion.div>
                </motion.div>
              </div>

              {/* Error Message */}
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
                transition={{ duration: 0.5, delay: 0.4 }}
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
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    <span className='flex items-center justify-center gap-2'>
                      Create Account
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
                    Already a member?
                  </span>
                </div>
              </div>

              <div className='text-center'>
                <Link
                  to='/login'
                  className='inline-flex items-center gap-2 font-semibold text-slate-600 decoration-blue-500/30 decoration-2 underline-offset-4 transition-all duration-200 hover:text-blue-600 hover:underline'
                >
                  <span>Sign in to your account</span>
                  <div className='border-l-3 h-0 w-0 border-y-2 border-y-transparent border-l-current transition-transform duration-200 hover:translate-x-0.5' />
                </Link>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </AuthLayout>
  );
};

export default SignupPage;
