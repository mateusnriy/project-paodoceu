import { io, Socket } from 'socket.io-client';

const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Conecta ao namespace raiz do servidor (mesma URL da API)
// A opção 'withCredentials' é vital para o CORS do Socket.IO
export const socket: Socket = io(VITE_API_BASE_URL || 'http://localhost:3333', {
  withCredentials: true,
  transports: ['websocket', 'polling'], // Fallback para polling se WS falhar
});

socket.on('connect', () => {
  console.log('Socket.IO Conectado:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('Socket.IO Desconectado:', reason);
});

socket.on('connect_error', (err) => {
  console.error('Socket.IO Erro de Conexão:', err.message);
});
