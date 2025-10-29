import 'dotenv/config';
import { app } from './app';
import { createServer } from 'http'; 
import { env } from './config/env';
import { logger } from './lib/logger';
import { initSocketServer } from './lib/socketServer'; 

const PORT = env.PORT;

const httpServer = createServer(app);

initSocketServer(httpServer);

const server = httpServer.listen(PORT, () => {
  logger.info(`Servidor HTTP e Socket.IO rodando na porta ${PORT}`);
});

process.on('SIGINT', () => {
  logger.info('Recebido SIGINT. Fechando servidor...');
  server.close(() => {
    logger.info('Servidor HTTP fechado.');
    process.exit(0);
  });
});
