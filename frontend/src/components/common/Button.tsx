import React, { memo, forwardRef } from 'react'; // Importado memo e forwardRef

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // Extende atributos HTML
  children: React.ReactNode;
  variant?: 'filled' | 'outlined';
  color?: 'primary' | 'accent' | 'success' | 'error';
  fullWidth?: boolean;
  className?: string;
  // onClick, type, disabled já vêm de React.ButtonHTMLAttributes
}

// Envolvido com memo e forwardRef para permitir passar ref se necessário
export const Button = memo(
  forwardRef<HTMLButtonElement, ButtonProps>(
    (
      {
        children,
        variant = 'filled',
        color = 'primary',
        fullWidth = false,
        className = '',
        type = 'button', // Default type
        disabled = false,
        ...props // Restante dos atributos HTML (onClick, aria-label, etc.)
      },
      ref
    ) => {
      const baseClasses =
        'flex items-center justify-center px-6 py-3 font-medium transition-all duration-200 rounded-4xl text-base focus:outline-none focus:ring-2 focus:ring-offset-1'; // Adicionado focus state

      const variantColorClasses = {
        filled: {
          primary: 'bg-primary text-white hover:bg-primary/90 focus:ring-primary',
          accent: 'bg-accent text-white hover:bg-accent/90 focus:ring-accent',
          success: 'bg-success text-white hover:bg-success/90 focus:ring-success',
          error: 'bg-error text-white hover:bg-error/90 focus:ring-error',
        },
        outlined: {
          primary:
            'bg-transparent border-2 border-primary text-primary hover:bg-primary/10 focus:ring-primary',
          accent:
            'bg-transparent border-2 border-accent text-accent hover:bg-accent/10 focus:ring-accent',
          success:
            'bg-transparent border-2 border-success text-success hover:bg-success/10 focus:ring-success',
          error:
            'bg-transparent border-2 border-error text-error hover:bg-error/10 focus:ring-error',
        },
      };

      const widthClass = fullWidth ? 'w-full' : '';
      const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

      return (
        <button
          ref={ref} // Passa a ref
          type={type}
          disabled={disabled}
          className={`${baseClasses} ${variantColorClasses[variant][color]} ${widthClass} ${disabledClass} ${className}`}
          {...props} // Aplica outros atributos HTML
        >
          {children}
        </button>
      );
    }
  )
);

Button.displayName = 'Button'; // DisplayName adicionado
