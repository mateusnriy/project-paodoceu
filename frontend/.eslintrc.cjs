// frontend/.eslintrc.cjs
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  parser: '@typescript-eslint/parser', // Especifica o parser TypeScript
  parserOptions: {
    ecmaVersion: 'latest', // Permite as features mais recentes do ECMAScript
    sourceType: 'module', // Permite uso de imports
    ecmaFeatures: {
      jsx: true, // Habilita parsing de JSX
    },
  },
  plugins: [
    '@typescript-eslint', // Plugin TypeScript
    'react-refresh',
    'react-hooks',      // Plugin para regras de Hooks (mantido aqui para clareza ou se não for incluído por 'react/recommended')
    'prettier'          // Integra o Prettier como regra ESLint
  ],
  extends: [
    'eslint:recommended', // Regras base recomendadas pelo ESLint
    'plugin:@typescript-eslint/recommended', // Regras recomendadas para TypeScript
    'plugin:react/recommended', // Regras recomendadas para React
    'plugin:react/jsx-runtime', // Para o novo JSX runtime (React 17+)
    'plugin:react-hooks/recommended', // Regras recomendadas para Hooks
    'plugin:prettier/recommended', // Habilita eslint-plugin-prettier e eslint-config-prettier
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'vite.config.ts', 'postcss.config.js', 'tailwind.config.js'], // Ignora arquivos de build e config
  settings: {
    react: {
      version: 'detect', // Detecta automaticamente a versão do React
    },
  },
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'prettier/prettier': 'warn', // Mostra erros do Prettier como warnings no ESLint
    '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }], // Avisa sobre vars não usadas (ignora se começar com _)
    'no-console': ['warn', { allow: ['warn', 'error'] }], // Avisa sobre console.log (permite warn e error)
    // Adicionar regras específicas de acessibilidade (eslint-plugin-jsx-a11y) seria o próximo passo
  },
}
