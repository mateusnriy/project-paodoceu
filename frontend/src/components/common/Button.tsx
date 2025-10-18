import React, { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { cva, VariantProps } from 'class-variance-authority';

// Define as variantes do botão usando CVA (class-variance-authority)
// Isso nos permite aplicar os novos tokens do tailwind.config.js
const buttonVariants = cva(
  'inline-flex items-center justify-center font-semibold rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-blue',
  {
    variants: {
      // Variantes de Estilo (Cores)
      variant: {
        primary:
          'bg-primary-blue text-white hover:bg-primary-blue-hover',
        secondary:
          'bg-gray-100 text-text-primary hover:bg-gray-200 border border-gray-300',
        danger:
          'bg-status-error text-white hover:bg-status-error/90 focus:ring-status-error',
        link: 'text-primary-blue underline-offset-4 hover:underline focus:ring-primary-blue',
      },
      // Variantes de Tamanho (Padding e Fonte) - 8px grid
      size: {
        sm: 'px-3 py-1.5 text-sm',         // 6px + 12px = 18px (h-small)
        md: 'px-4 py-2 text-base',        // 8px + 16px = 24px (h-medium)
        lg: 'px-6 py-3 text-lg font-bold', // 12px + 18px = 30px (h-large)
      },
    },
    // Estado Desabilitado: Aplica globalmente a todas as variantes
    // Usa os novos tokens 'status-disabled-bg' e 'status-disabled-text'
    // Removemos 'opacity-50' em favor de cores específicas.
    // A exceção é a variante 'link', que só fica com cor de texto desabilitada.
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

// Define as Props do componente, estendendo ButtonHTMLAttributes
export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: ReactNode;
}

// Cria o componente Button usando React.memo e forwardRef
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
