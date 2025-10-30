import { io, Socket } from 'socket.io-client';
import { logError } from '@/utils/logger'; // (Limpeza) Usar alias de path

const VITE_WS_URL = import.meta.env.VITE_WS_URL;

if (!VITE_WS_URL) {
  logError('VITE_WS_URL não está definida no .env');
}

// Conecta à URL raiz do servidor, onde o Socket.IO está escutando
export const socket: Socket = io(VITE_WS_URL || 'http://localhost:3333', {
  withCredentials: true,
  transports: ['websocket', 'polling'], // Fallback
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
