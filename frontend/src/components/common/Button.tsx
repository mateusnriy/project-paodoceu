import React, { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { cva, VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-semibold rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-blue',
  {
    variants: {
      variant: {
        primary:
          'bg-primary-blue text-white hover:bg-primary-blue-hover',
        secondary:
          'bg-gray-100 text-text-primary hover:bg-gray-200 border border-gray-300',
        danger:
          'bg-status-error text-white hover:bg-status-error/90 focus:ring-status-error',
        link: 'text-primary-blue underline-offset-4 hover:underline focus:ring-primary-blue',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',         // 6px + 12px = 18px (h-small)
        md: 'px-4 py-2 text-base',        // 8px + 16px = 24px (h-medium)
        lg: 'px-6 py-3 text-lg font-bold', // 12px + 18px = 30px (h-large)
      },
    },
    
    compoundVariants: [
      {
        variant: ['primary', 'secondary', 'danger'],
        className: 'disabled:bg-status-disabled-bg disabled:text-status-disabled-text disabled:cursor-not-allowed disabled:border-transparent',
      },
      {
        variant: 'link',
        className: 'disabled:text-status-disabled-text disabled:cursor-not-allowed',
      },
    ],
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: ReactNode;
}


const Button = React.memo(
  forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, children, ...props }, ref) => {
      return (
        <button
          className={buttonVariants({ variant, size, className })}
          ref={ref}
          {...props} // Passa 'disabled', 'onClick', etc.
        >
          {children}
        </button>
      );
    }
  )
);

Button.displayName = 'Button';

export { Button, buttonVariants };
