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
        : '[https://seu-dominio-de-producao.com](https://seu-dominio-de-producao.com)', //Atualizar em produção
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`Cliente conectado (Socket ID: ${socket.id})`);

    socket.on('disconnect', () => {
      logger.info(`Cliente desconectado (Socket ID: ${socket.id})`);
    });
  });

  logger.info('Servidor Socket.IO inicializado.');
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO não inicializado!');
  }
  return io;
};
