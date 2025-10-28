import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NavigationProvider } from './contexts/NavigationContext';
import AppRouter from './AppRouter';
import { Toaster } from 'react-hot-toast'; // <--- (RF24) IMPORTAR

function App() {
  return (
    <BrowserRouter>
      {/* (RF24) Adiciona o provider de Toasts/Notificações */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />
      <AuthProvider>
        <NavigationProvider>
          <AppRouter />
        </NavigationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
