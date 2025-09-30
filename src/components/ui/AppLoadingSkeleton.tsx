import React from 'react';
import { Skeleton, SkeletonCard, SkeletonList, SkeletonText, SkeletonAvatar } from './Skeleton';

interface AppLoadingSkeletonProps {
  variant?: 'dashboard' | 'login' | 'minimal' | 'full';
  className?: string;
}

export const AppLoadingSkeleton: React.FC<AppLoadingSkeletonProps> = ({
  variant = 'dashboard',
  className = '',
}) => {
  if (variant === 'login') {
    return (
      <div className={`flex min-h-screen items-center justify-center bg-gray-50 ${className}`}>
        <div className='w-full max-w-md space-y-8'>
          <div className='text-center'>
            <Skeleton height='2rem' width='60%' className='mx-auto' />
            <Skeleton height='1rem' width='80%' className='mx-auto mt-2' />
          </div>
          <div className='space-y-4'>
            <div>
              <Skeleton height='1rem' width='20%' />
              <Skeleton height='2.5rem' className='mt-1' />
            </div>
            <div>
              <Skeleton height='1rem' width='25%' />
              <Skeleton height='2.5rem' className='mt-1' />
            </div>
            <Skeleton height='2.5rem' />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={`flex min-h-screen items-center justify-center ${className}`}>
        <div className='space-y-4 text-center'>
          <div className='mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent'></div>
          <SkeletonText lines={1} className='mx-auto w-32' />
        </div>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`min-h-screen bg-gray-50 ${className}`}>
        {/* Header skeleton */}
        <div className='border-b border-gray-200 bg-white shadow-sm'>
          <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
            <div className='flex items-center justify-between py-4'>
              <div className='flex items-center space-x-4'>
                <Skeleton width='2rem' height='2rem' />
                <Skeleton width='8rem' height='1.5rem' />
              </div>
              <div className='flex items-center space-x-3'>
                <Skeleton width='5rem' height='1.5rem' />
                <SkeletonAvatar />
              </div>
            </div>
          </div>
        </div>

        {/* Main content skeleton */}
        <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
            {/* Main content area */}
            <div className='space-y-6 lg:col-span-2'>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonList items={4} />
            </div>

            {/* Sidebar */}
            <div className='space-y-6'>
              <SkeletonCard />
              <div className='space-y-3'>
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} height='2.5rem' />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: dashboard variant
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header skeleton */}
      <div className='border-b border-gray-200 bg-white shadow-sm'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between py-4'>
            <div className='flex items-center space-x-4'>
              <Skeleton width='2rem' height='2rem' />
              <Skeleton width='8rem' height='1.5rem' />
            </div>
            <div className='flex items-center space-x-3'>
              <Skeleton width='5rem' height='1.5rem' />
              <SkeletonAvatar />
            </div>
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        <div className='space-y-6'>
          {/* Page title */}
          <div>
            <Skeleton height='2rem' width='40%' />
            <Skeleton height='1rem' width='60%' className='mt-2' />
          </div>

          {/* Stats cards */}
          <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className='rounded-lg border border-gray-200 bg-white p-6 shadow-sm'>
                <div className='flex items-center justify-between'>
                  <div>
                    <Skeleton height='1rem' width='60%' />
                    <Skeleton height='2rem' width='40%' className='mt-2' />
                  </div>
                  <Skeleton width='3rem' height='3rem' variant='circular' />
                </div>
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLoadingSkeleton;
