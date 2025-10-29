// frontend/src/App.tsx

// import { BrowserRouter } from 'react-router-dom'; // <<< REMOVIDO
import { AuthProvider } from './contexts/AuthContext';
import { NavigationProvider } from './contexts/NavigationContext';
import AppRouter from './AppRouter';
import { Toaster } from 'react-hot-toast'; // (RF24)

function App() {
  return (
    // <BrowserRouter> {/* <<< REMOVIDO */}
    <>
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
    </>
    // </BrowserRouter> {/* <<< REMOVIDO */}
  );
}

export default App;
