import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/utils.ts';

const inputVariants = cva(
  'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-input focus-visible:ring-ring',
        success: 'border-green-500 focus-visible:ring-green-500',
        error: 'border-red-500 focus-visible:ring-red-500',
        warning: 'border-yellow-500 focus-visible:ring-yellow-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  error?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, error, helperText, ...props }, ref) => {
    const inputVariant = error ? 'error' : variant;

    return (
      <div className='w-full'>
        <input
          type={type}
          className={cn(inputVariants({ variant: inputVariant, className }))}
          ref={ref}
          {...props}
        />
        {(error || helperText) && (
          <p className={cn('mt-1 text-xs', error ? 'text-red-500' : 'text-muted-foreground')}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input, inputVariants };
