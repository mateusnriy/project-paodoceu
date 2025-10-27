// src/App.tsx
import { AppRouter } from './AppRouter';
import { AuthProvider } from './contexts/AuthContext';
import { NavigationProvider } from './contexts/NavigationContext';

export function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <AppRouter />
      </NavigationProvider>
    </AuthProvider>
  );
}
