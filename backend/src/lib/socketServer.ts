import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from './logger';
import { env } from '../config/env'; // (CORREÇÃO) Importar 'env'

// (CORREÇÃO ERRO 16) Armazenar a instância Singleton
let io: Server;

export const initSocketServer = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN, // Vindo do .env
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    logger.info(`Socket conectado: ${socket.id}`);

    // Salas (Rooms) para RNF08
    socket.on('join_pdv', () => {
      socket.join('pdv');
      logger.info(`Socket ${socket.id} entrou na sala [pdv]`);
    });

    socket.on('join_display', () => {
      socket.join('display');
      logger.info(`Socket ${socket.id} entrou na sala [display]`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket desconectado: ${socket.id}`);
    });
  });

  return io;
};

/**
 * (CORREÇÃO ERRO 16) Exporta a instância 'io' inicializada.
 */
export const getSocketServer = (): Server => {
  if (!io) {
    // (CORREÇÃO TESTE) Se estivermos no ambiente 'test', retorna um mock
    // funcional que não faz nada, mas impede que a aplicação quebre
    // durante a instanciação dos serviços.
    if (env.NODE_ENV === 'test') {
      logger.warn(
        'Socket.io não inicializado (NODE_ENV=test), retornando mock.',
      );
      return {
        to: () => ({ emit: () => {} }),
        emit: () => {},
      } as unknown as Server;
    }

    // Em produção ou dev, lança o erro se não foi inicializado
    throw new Error(
      'Socket.io não inicializado! Chame initSocketServer() primeiro.',
    );
  }
  return io;
};
