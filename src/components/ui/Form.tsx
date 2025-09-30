import * as React from 'react';
import { cn } from '../../lib/utils';

// Form Context
interface FormContextType {
  errors: Record<string, string>;
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;
}

const FormContext = React.createContext<FormContextType | null>(null);

// Form Root Component
interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  errors?: Record<string, string>;
  onErrorsChange?: (errors: Record<string, string>) => void;
}

const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, errors = {}, onErrorsChange, children, ...props }, ref) => {
    const [formErrors, setFormErrors] = React.useState<Record<string, string>>(errors);

    React.useEffect(() => {
      setFormErrors(errors);
    }, [errors]);

    const setError = React.useCallback(
      (field: string, error: string) => {
        const newErrors = { ...formErrors, [field]: error };
        setFormErrors(newErrors);
        onErrorsChange?.(newErrors);
      },
      [formErrors, onErrorsChange]
    );

    const clearError = React.useCallback(
      (field: string) => {
        const { [field]: _, ...newErrors } = formErrors;
        setFormErrors(newErrors);
        onErrorsChange?.(newErrors);
      },
      [formErrors, onErrorsChange]
    );

    const contextValue = React.useMemo(
      () => ({
        errors: formErrors,
        setError,
        clearError,
      }),
      [formErrors, setError, clearError]
    );

    return (
      <FormContext.Provider value={contextValue}>
        <form className={cn('space-y-4', className)} ref={ref} {...props}>
          {children}
        </form>
      </FormContext.Provider>
    );
  }
);
Form.displayName = 'Form';

// Form Field Container
interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, name, children, ...props }, ref) => {
    return (
      <div className={cn('space-y-2', className)} ref={ref} data-field-name={name} {...props}>
        {children}
      </div>
    );
  }
);
FormField.displayName = 'FormField';

// Form Label
interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, required, children, ...props }, ref) => {
    return (
      <label
        className={cn(
          'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
        {required && <span className='ml-1 text-red-500'>*</span>}
      </label>
    );
  }
);
FormLabel.displayName = 'FormLabel';

// Form Description
const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />;
});
FormDescription.displayName = 'FormDescription';

// Form Message (for errors and help text)
interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  type?: 'error' | 'warning' | 'info';
}

const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(
  ({ className, type = 'error', children, ...props }, ref) => {
    if (!children) return null;

    const typeStyles = {
      error: 'text-red-500',
      warning: 'text-yellow-600',
      info: 'text-blue-600',
    };

    return (
      <p ref={ref} className={cn('text-sm', typeStyles[type], className)} {...props}>
        {children}
      </p>
    );
  }
);
FormMessage.displayName = 'FormMessage';

// Hook to use form context
export function useFormField(name?: string) {
  const context = React.useContext(FormContext);

  if (!context) {
    throw new Error('useFormField must be used within a Form component');
  }

  const error = name ? context.errors[name] : undefined;

  return {
    error,
    setError: (error: string) => name && context.setError(name, error),
    clearError: () => name && context.clearError(name),
    hasError: Boolean(error),
  };
}

export {
  Form,
  FormField,
  FormLabel,
  FormDescription,
  FormMessage,
  FormContext,
  type FormContextType,
};
