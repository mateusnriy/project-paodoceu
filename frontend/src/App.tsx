import React from 'react';
import { AppRouter } from './AppRouter';
import { AuthProvider } from './contexts/AuthContext';
import { NavigationProvider } from './contexts/NavigationContext'; // <<< Importar NavigationProvider

export function App() {
  // AuthProvider fica aqui, dentro do BrowserRouter definido em index.tsx
  // NavigationProvider deve vir DENTRO do AuthProvider para acessar dados do usuário
  return (
    <AuthProvider>
      <NavigationProvider> {/* <<< Adicionar NavigationProvider */}
        <AppRouter />
      </NavigationProvider> {/* <<< Fechar NavigationProvider */}
    </AuthProvider>
  );
}
