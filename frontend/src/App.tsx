import React from 'react';
import { AppRouter } from './AppRouter';
import { AuthProvider } from './contexts/AuthContext';

export function App() {
  // AuthProvider fica aqui, dentro do BrowserRouter definido em index.tsx
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
