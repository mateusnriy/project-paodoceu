import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from '../config/env';
import { logger } from './logger';

let io: Server;

export const initSocketServer = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.NODE_ENV === 'development' 
        ? 'http://localhost:5173' // Origem do Vite
        : '[https://seu-dominio-de-producao.com](https://seu-dominio-de-producao.com)', // TODO: Atualizar em produção
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`Cliente conectado (Socket ID: ${socket.id})`);

    // Aqui pode-se adicionar lógica de autenticação do socket
    // ou entrada em "salas" (ex: "fila", "display")

    socket.on('disconnect', () => {
      logger.info(`Cliente desconectado (Socket ID: ${socket.id})`);
    });
  });

  logger.info('Servidor Socket.IO inicializado.');
};

/**
 * Retorna a instância global do Socket.IO Server.
 * Use para emitir eventos de outros módulos (ex: services).
 */
export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO não inicializado!');
  }
  return io;
};
