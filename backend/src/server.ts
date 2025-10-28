import 'dotenv/config';
import { app } from './app';
import { createServer } from 'http'; // <--- IMPORTAR
import { env } from './config/env';
import { logger } from './lib/logger';
import { initSocketServer } from './lib/socketServer'; // <--- IMPORTAR

const PORT = env.PORT;

// Criar servidor HTTP a partir do app Express
const httpServer = createServer(app); // <--- MODIFICAR

// Inicializar o Socket.IO Server, anexando-o ao servidor HTTP
initSocketServer(httpServer); // <--- ADICIONAR

const server = httpServer.listen(PORT, () => { // <--- USAR httpServer
  logger.info(`Servidor HTTP e Socket.IO rodando na porta ${PORT}`);
});

// Graceful shutdown (sem alteração)
process.on('SIGINT', () => {
  logger.info('Recebido SIGINT. Fechando servidor...');
  server.close(() => {
    logger.info('Servidor HTTP fechado.');
    process.exit(0);
  });
});

