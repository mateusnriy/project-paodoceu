/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Define a fonte padrão "Inter" como 'sans', mantendo fallbacks
      fontFamily: {
        sans: ['"Inter"', ...defaultTheme.fontFamily.sans],
      },
      
      // Define a nova escala tipográfica (item 2.2 do Guia)
      fontSize: {
        'xs': '0.75rem', // 12px
        'sm': '0.875rem', // 14px
        'base': '1rem', // 16px (Body)
        'lg': '1.125rem', // 18px
        'xl': '1.25rem', // 20px
        '2xl': '1.5rem', // 24px (H1)
        '3xl': '1.875rem', // 30px
        // ... outras se necessário
      },
      
      // Define a nova paleta de cores (item 2.1 do Guia)
      colors: {
        // Cores Primárias (Ações e Foco)
        'primary-blue': {
          DEFAULT: '#4A90E2',
          hover: '#357ABD', // 10% mais escuro (calculado)
          focus: '#4A90E2', // Usado para o ring
        },
        
        // Fundos (Layout)
        'background-light-blue': '#F0F7FF',
        'primary-white': '#FFFFFF',
        
        // Textos
        'text-primary': '#333333',
        'text-secondary': '#666666',

        // Cores de Status (Feedback)
        status: {
          success: {
            DEFAULT: '#10B981', // Mantido do original (Verde)
            bg: '#D1FAE5',
            text: '#065F46',
          },
          error: {
            DEFAULT: '#EF4444', // Mantido do original (Vermelho)
            bg: '#FEE2E2',
            text: '#991B1B',
          },
          warning: {
            DEFAULT: '#FFB020', // Guia de Estilo v2.0
            bg: '#FFF8E9', // Cor de fundo calculada
            text: '#B37C17', // Cor de texto calculada
          },
          disabled: {
            bg: '#E0E0E0', // Guia de Estilo v2.0
            text: '#A0A0A0', // Guia de Estilo v2.0
          },
        },

        // Removemos as cores antigas 'primary' e 'accent'
      },
      
      // Define as sombras (item 2.3 do Guia)
      boxShadow: {
        soft: '0 4px 12px rgba(0, 0, 0, 0.05)',
      },
      
      // Define os raios de borda (item 2.3 do Guia)
      borderRadius: {
        DEFAULT: '0.25rem', // 4px
        sm: '0.125rem', // 2px
        md: '0.375rem', // 6px
        lg: '0.5rem', // 8px (Médio)
        xl: '0.75rem', // 12px (Maior)
        '2xl': '1rem', // 16px
        '3xl': '1.5rem', // 24px
        full: '9999px',
      },

      // Define o ring (foco) para usar a nova cor primária
      ringColor: ({ theme }) => ({
        DEFAULT: theme('colors.primary-blue.DEFAULT', '#4A90E2'),
      }),
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
