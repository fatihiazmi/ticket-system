import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  variant = 'rectangular',
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse', // Could be enhanced with a wave animation
    none: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

// Pre-built skeleton components for common use cases
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 1,
  className = '',
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }, (_, i) => (
      <Skeleton key={i} variant='text' height='1rem' width={i === lines - 1 ? '75%' : '100%'} />
    ))}
  </div>
);

export const SkeletonAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return <Skeleton variant='circular' className={`${sizeClasses[size]} ${className}`} />;
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`space-y-3 rounded-lg border border-gray-200 p-4 ${className}`}>
    <div className='flex items-center space-x-3'>
      <SkeletonAvatar />
      <div className='flex-1'>
        <Skeleton height='1rem' width='60%' />
        <Skeleton height='0.875rem' width='40%' className='mt-1' />
      </div>
    </div>
    <SkeletonText lines={3} />
    <div className='flex space-x-2'>
      <Skeleton height='2rem' width='4rem' />
      <Skeleton height='2rem' width='4rem' />
    </div>
  </div>
);

export const SkeletonList: React.FC<{ items?: number; className?: string }> = ({
  items = 3,
  className = '',
}) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: items }, (_, i) => (
      <div key={i} className='flex items-center space-x-3 rounded-lg border border-gray-200 p-3'>
        <SkeletonAvatar />
        <div className='flex-1'>
          <Skeleton height='1rem' width='80%' />
          <Skeleton height='0.875rem' width='60%' className='mt-1' />
        </div>
      </div>
    ))}
  </div>
);

export default Skeleton;
