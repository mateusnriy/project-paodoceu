import app from './app';
// Remover dotenv daqui, pois já é carregado em config/env.ts
// import dotenv from 'dotenv';
import logger from './lib/logger';
import { env } from './config/env'; // <<< Importar as variáveis validadas

// dotenv.config(); // <<< REMOVER

// Usar a porta validada do objeto 'env'
const PORT = env.PORT; // <<< ALTERADO

app.listen(PORT, () => {
  logger.info(`Servidor Pão do Céu rodando na porta ${PORT} em modo ${env.NODE_ENV}`); // <<< ALTERADO
  logger.info(`Acesso em: http://localhost:${PORT}`);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // process.exit(1); // Considerar descomentar em produção
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // process.exit(1); // Considerar descomentar em produção
});
