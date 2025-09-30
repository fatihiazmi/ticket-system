import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';

import { cn } from '../../lib/utils.ts';

const selectVariants = cva(
  'flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-input focus:ring-ring',
        error: 'border-red-500 focus:ring-red-500',
        success: 'border-green-500 focus:ring-green-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    VariantProps<typeof selectVariants> {
  error?: string;
  helperText?: string;
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, variant, error, helperText, placeholder, ...props }, ref) => {
    const selectVariant = error ? 'error' : variant;

    return (
      <div className='relative w-full'>
        <select
          className={cn(selectVariants({ variant: selectVariant, className }), 'appearance-none')}
          ref={ref}
          {...props}
        >
          {placeholder && (
            <option value='' disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        <ChevronDown className='pointer-events-none absolute right-3 top-3 h-4 w-4 opacity-50' />
        {(error || helperText) && (
          <p className={cn('mt-1 text-xs', error ? 'text-red-500' : 'text-muted-foreground')}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Select, selectVariants };
